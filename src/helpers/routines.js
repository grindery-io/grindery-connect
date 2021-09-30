/*global chrome*/
import Web3 from 'web3';
import _ from 'lodash';

import {INTEGRATIONS, MESSAGE_TYPES, SPREADSHEET_COLUMNS} from './contants';
import {
  deduplicateContacts,
  columnToLetter
} from './utils';
import {readFromStorage, STORAGE_KEYS, writeToStorage} from './storage';
import {getAuthToken, getSpreadsheetData, updateSpreadsheetData} from './google';
import {ERROR_MESSAGES, GrinderyError} from './errors';
import {createProvider, createWeb3} from './metamask';

export const getWeb3Instance = () => {
  try {
    const provider = createProvider();
    if (provider) {
      return createWeb3(provider);
    }
  } catch (e) {
    //console.error('provider or web3 error => ', e);
  }
  return null;
};

export const sendExtensionMessage = data => {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(data || {}, res => {
        if(chrome.runtime.lastError) {
          //console.error('sendExtensionMessage chrome.runtime.lastError => ', chrome.runtime.lastError.message || chrome.runtime.lastError);
          reject(chrome.runtime.lastError.message || chrome.runtime.lastError);
        } else if(res && res.data) {
          resolve(res && res.data || null);
        } else {
          //console.error('chrome sendMessage error => ', res && res.error);
          reject(res && res.error || null);
        }
      });
    } catch (e) {
      //console.error('chrome sendMessage error => ', e);
      reject(e);
    }
  });
};

export const makeBackgroundRequest = (task, payload=null) => {
  return sendExtensionMessage({
    type: MESSAGE_TYPES.TASK,
    task,
    payload,
  });
};

export const sendExtensionNotification = (event, payload=null) => {
  return sendExtensionMessage({
    type: MESSAGE_TYPES.NOTIFICATION,
    event,
    payload,
  });
};

export const sendExtensionEvent = (event, payload=null) => {
  return sendExtensionMessage({
    type: MESSAGE_TYPES.EVENT,
    event,
    payload,
  });
};

export const sendContentRequest = (action, payload=null) => {
  const data = {
    type: MESSAGE_TYPES.ACTION,
    action,
    payload,
  };
  return new Promise((resolve, reject) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const tabId = tabs && tabs[0] && tabs[0].id || null;
      if(tabId) {
        chrome.tabs.sendMessage(tabId, data, (res) => {
          if(res && res.data) {
            resolve(res && res.data || null);
          } else {
            reject(res && res.error || null);
          }
        });
      } else {
        reject(new Error('Failed to get current tab'));
      }
    });
  });
};

export const listenForExtensionNotification = (events, callback) => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(chrome.runtime.lastError) {
      return;
    }

    if(message && message.type === MESSAGE_TYPES.NOTIFICATION && (Array.isArray(events) && events.includes(message.event) || message.event === events)) {
      callback(message.event, message.payload);
      sendResponse({message: 'received'});
    }
  });
};

export const listenForExtensionEvent = (events, callback) => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(chrome.runtime.lastError) {
      //console.error('listenForExtensionEvent chrome.runtime.lastError => ', chrome.runtime.lastError.message || chrome.runtime.lastError);
      return;
    }

    if(message && message.type === MESSAGE_TYPES.EVENT && (Array.isArray(events) && events.includes(message.event) || message.event === events)) {
      callback(message.event, message.payload);
      sendResponse({message: 'received'});
    }
  });
};

export const getContactsFromSheetData = (columnMap, spreadsheetData) => {
  let contacts = [];
  const spreadsheetColumns = spreadsheetData[0];

  for (const item of (spreadsheetData || []).slice(1)) {
    let contact = {};

    for (const key of [SPREADSHEET_COLUMNS.NAME, SPREADSHEET_COLUMNS.EMAIL, SPREADSHEET_COLUMNS.ADDRESS]) {
      const spreadsheetColumnName = key && columnMap[key],
        spreadsheetColumnIdx = spreadsheetColumns.indexOf(spreadsheetColumnName);
      if (spreadsheetColumnIdx > -1) {
        contact[key] = item[spreadsheetColumnIdx];
      }
    }

    if (Object.keys(contact).length && Web3.utils.isAddress(contact.address)) {
      contacts.push(contact);
    }
  }

  return contacts;
};

export const getSheetDataFromContacts = (sheetTitle, columnMap, columns, contacts) => {
  let data = [],
    keyMap = {};

  let cleanedColumns = [...(columns || [])];
  for (const key of Object.keys(columnMap)) {
    const columnName = columnMap[key];
    if(!(columns || []).includes(columnName)) {
      cleanedColumns.push(columnName);
    }
  }

  if(contacts && Array.isArray(contacts)) {
    for (const key of Object.keys(columnMap)) {
      keyMap[columnMap[key]] = key;
    }

    for (const [idx, contact] of (contacts || []).entries()) {
      if(contact) {
        let columnIndices = [],
          rowValues = [];

        const cleanValue = (item, key) => (item && (item[key] || typeof item[key] === 'number'))?item[key]:'';

        for (const columnName of Object.keys(keyMap)) {
          const key = keyMap[columnName];
          const columnIdx = (cleanedColumns || []).indexOf(columnName);
          if([SPREADSHEET_COLUMNS.NAME, SPREADSHEET_COLUMNS.EMAIL, SPREADSHEET_COLUMNS.ADDRESS].includes(key)) {
            columnIndices.push(columnIdx);
            rowValues.push(cleanValue(contact, key));
          }
        }

        if(rowValues.length && columnIndices.length === rowValues.length) {
          let groups = [],
            currentGroup = {row: idx, values: []};

          for (const [itemIdx, value] of rowValues.entries()) {
            const columnIdx = columnIndices[itemIdx];
            if(typeof currentGroup.start !== 'number') {
              currentGroup.start = columnIdx;
              currentGroup.end = columnIdx;
            } else if(typeof currentGroup.end === 'number' && (columnIdx - currentGroup.end) === 1) {
              currentGroup.end = columnIdx;
            } else {
              groups.push(currentGroup);
              currentGroup = {row: idx, values: [], start: columnIdx, end: columnIdx};
            }
            currentGroup.values.push(value);
            if(itemIdx === (rowValues.length - 1)) {
              groups.push(currentGroup);
            }
          }

          for (const group of groups) {
            data.push({
              range: `${sheetTitle}!${_.uniq([group.start, group.end]).map(i => `${columnToLetter(i+1)}${group.row+2}`).join(':')}`,
              values: [group.values],
            });
          }
        }
      }
    }
  }
  return data;
};

export const mergeContactsWithGoogleSheetsData = async () => {
  return readFromStorage(STORAGE_KEYS.INTEGRATIONS).then(res => {
    const integrations = res || {};
    if(integrations && integrations[INTEGRATIONS.GOOGLE_SHEETS]) {
      const spreadsheet = integrations[INTEGRATIONS.GOOGLE_SHEETS];
      if(spreadsheet && spreadsheet.id && spreadsheet.sheet && spreadsheet.sheet.title && spreadsheet.columnMap) {
        return getAuthToken().then(token => {
          if(token) {
            return getSpreadsheetData(token, spreadsheet.id, spreadsheet.sheet.title).then(data => {
              if(data && Array.isArray(data)) {
                const sheetContacts = getContactsFromSheetData(spreadsheet.columnMap, data);
                return readFromStorage(STORAGE_KEYS.CONTACTS).then(res => {
                  const localContacts = res && Array.isArray(res)?res:[];
                  const contacts = deduplicateContacts([...localContacts, ...sheetContacts]);
                  const sheetData = getSheetDataFromContacts(spreadsheet.sheet.title, spreadsheet.columnMap, data && data[0] || [], contacts);
                  return {contacts, spreadsheet, data: sheetData};
                }).catch(e => {
                  throw new GrinderyError(e);
                });
              } else {
                throw new GrinderyError(ERROR_MESSAGES.GOOGLE_SHEETS_READ_FAILED);
              }
            }).catch(() => {
              throw new GrinderyError(ERROR_MESSAGES.GOOGLE_SHEETS_READ_FAILED);
            });
          } else {
            throw new GrinderyError(ERROR_MESSAGES.GOOGLE_CONNECT_FAILED);
          }
        }).catch(() => {
          throw new GrinderyError(ERROR_MESSAGES.GOOGLE_CONNECT_FAILED);
        });
      } else {
        throw new GrinderyError(ERROR_MESSAGES.GOOGLE_SHEETS_NO_INTEGRATION);
      }
    } else {
      throw new GrinderyError(ERROR_MESSAGES.GOOGLE_SHEETS_NO_INTEGRATION);
    }
  }).catch(e => {
    throw new GrinderyError(e);
  });
};

export const syncContactsWithGoogleSheets = async () => {
  return mergeContactsWithGoogleSheetsData().then(res => {
    const {contacts, spreadsheet, data} = res || {};
    if(contacts && Array.isArray(contacts)) {
      return writeToStorage(STORAGE_KEYS.CONTACTS, contacts).then(() => {
        if(spreadsheet && spreadsheet.id && data && Array.isArray(data) && data.length) {
          getAuthToken().then(token => {
            if(token) {
              updateSpreadsheetData(token, spreadsheet.id, {
                valueInputOption: 'USER_ENTERED',
                data,
              }).catch(() => {});
            }
          });
        }
        return contacts;
      }).catch(e => {
        throw new GrinderyError(e, ERROR_MESSAGES.SAVE_FAILED);
      });
    } else {
      throw new GrinderyError(ERROR_MESSAGES.GOOGLE_SHEETS_MERGE_FAILED);
    }
  }).catch(e => {
    throw new GrinderyError(e)
  });
};