/*global chrome*/
import {ACTIONS, EXTENSION_SELECTOR, MESSAGE_TYPES} from './helpers/contants';
import {ERROR_MESSAGES} from './helpers/errors';

// Inject root div if it doesn't already exist
const frameElement = document.getElementById(
  EXTENSION_SELECTOR,
);
if(frameElement) {
  frameElement.remove();
} else {
  let elem = document.createElement('iframe');
  elem.id = EXTENSION_SELECTOR;
  elem.src = chrome.runtime.getURL('index.html');
  elem.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    z-index: 99999;
    width: 415px;
    height: 100vh;
    border-width: 0;
  `;
  document.body.appendChild(elem);
}

const getActiveGoogleSheetData = () => {
  let spreadsheetId = null,
    sheetIdx = null,
    sheetTitle = null;

  if(window.location.hostname === 'docs.google.com') {
    const [, appType, prefix, id] = (window.location.pathname || '').split('/');
    if(appType === 'spreadsheets' && prefix === 'd') {
      spreadsheetId = id;
    }
    if(id) {
      const selectedSheets = document.querySelectorAll(
        '.docs-sheet-tab.docs-sheet-active-tab .docs-sheet-tab-caption .docs-sheet-tab-name'
      );
      if(selectedSheets && selectedSheets.length) {
        sheetTitle = (selectedSheets[0].innerHTML || '').trim();

        const allSheets = document.querySelectorAll(
          '.docs-sheet-tab'
        );
        if(allSheets && allSheets.length) {
          for (const [idx, node] of allSheets.entries()) {
            const nameNodes = node.querySelectorAll('.docs-sheet-tab-caption .docs-sheet-tab-name');
            if(nameNodes && nameNodes.length) {
              const itemName = (nameNodes[0].innerHTML || '').trim();
              if(itemName === sheetTitle) {
                sheetIdx = idx;
              }
            }
          }
        }
      }
    }
  }

  if(spreadsheetId) {
    return {
      id: spreadsheetId || null,
      ...((sheetIdx || sheetTitle)?{
        sheet: {
          index: sheetIdx || null,
          title: sheetTitle || null,
        },
      }:{}),
    };
  }
  return null;
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const sendSuccessResponse = data => {
    sendResponse({
      data,
    });
  };

  const sendErrorResponse = error => {
    sendResponse({
      error: (error && error.message) || (error && typeof error === 'string' && error) || ERROR_MESSAGES.UNKNOWN,
    });
  };

  if(message && message.type === MESSAGE_TYPES.ACTION) {
    const action = message && message.action || null;
    switch (action) {
      case ACTIONS.CLOSE: {
        const frameElement = document.getElementById(
          EXTENSION_SELECTOR,
        );
        if(frameElement) {
          frameElement.remove();
        }
        sendSuccessResponse({message: 'closed'});
        return ;
      }
      case ACTIONS.GET_ACTIVE_GOOGLE_SHEET_DATA: {
        const data = getActiveGoogleSheetData();
        if(data) {
          sendSuccessResponse(data);
        } else {
          sendErrorResponse('Failed to retrieve Google sheets data');
        }
        return ;
      }
      default: {
        break;
      }
    }
    sendErrorResponse();
  }
});