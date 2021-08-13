import React, {useEffect, useRef, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {CircularProgress} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import _ from 'lodash';
import bcrypt from 'bcryptjs';
import Decimal from 'decimal.js';
import clsx from 'clsx';
import moment from 'moment';

import TitleBar from './TitleBar';
import TabBar from './TabBar';
import ContentRouter from './ContentRouter';
import DialogRouter from './DialogRouter';
import ErrorBoundary from './ErrorBoundary';

import AppContext, {defaultAppState} from '../../AppContext';

import {DIALOG_ACTIONS, SCREENS, TASKS} from '../../helpers/contants';
import {
  STORAGE_KEYS,
  readFromStorage,
  writeToStorage,
  getAddresses,
  getNetworks,
  clearSnapshot,
  getSnapshot,
  setHidePrePaymentNotice,
  getHidePrePaymentNotice,
  getHash,
  saveHash
} from '../../helpers/storage';
import {
  contactComparator,
  decodeVersionedHash,
  deduplicateContacts,
  deduplicatePayments,
  generateVersionedHash,
  getChains,
  getPriceData,
} from '../../helpers/utils';
import {makeBackgroundRequest} from '../../helpers/routines';
import {ERROR_MESSAGES, GrinderyError} from '../../helpers/errors';
import {COLORS} from '../../helpers/style';

import cachedChains from '../../helpers/chains.json';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 375,
    height: 600,
    '& > *': {
      width: '100%',
    },
  },
  loading: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
  },
  mainContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: theme.spacing(2.5),
    overflowY: 'auto',
    '& > *': {
      width: '100%',
    },
  },
  mainContentGreyBg: {
    backgroundColor: COLORS.contentBg,
  },
  mainContentNoPadding: {
    padding: 0,
  }
}));

export default () => {
  const classes = useStyles();

  // Session Initialization
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [isNewUser, setIsNewUser] = useState(null);
  const [hidePaymentNotice, setHidePaymentNotice] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [chains, setChains] = useState(cachedChains || []);

  // Navigation
  const [screen, setScreen] = useState(SCREENS.AUTH);
  const [dialog, setDialog] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Data
  const [addresses, setAddresses] = useState([]);
  const [networks, setNetworks] = useState(null);
  const [currency, setCurrency] = useState(null);
  const [decimals, setDecimals] = useState(18);
  const [rate, setRate] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [integrations, setIntegrations] = useState({});

  const dialogRef = useRef(null);

  const restoreSession = (resume=false) => {
    if(resume) {
      // Restore snapshot
      getSnapshot().then(snapshot => {
        if(snapshot) {
          const {screen, dialog, state} = snapshot;
          if(screen) {
            setScreen(screen);
          }
          if(dialog && dialog.action) {
            setDialog({
              ...dialog,
              data: {
                ...(dialog.data || {}),
                ...(state?{state}:{}),
              },
            });
          }
          // Clear snapshot
          clearSnapshot().catch(() => {});
        }
      }).catch(e => {
        //console.error('snapshot error => ', e);
      });
    } else {
      // Clear snapshot
      clearSnapshot().catch(() => {});
    }
    setSessionInitialized(true);
  };

  // Initialize session and chains
  useEffect(() => {
    getChains().then(res => {
      if (res && Array.isArray(res) && res.length) {
        setChains(res);
      }
    }).catch(() => {});

    getHash().then(hash => {
      setIsNewUser(!hash);
      if (hash) {
        readFromStorage(STORAGE_KEYS.LAST_ACTIVITY_AT).then(res => {
          const lastActivityAt = res && moment.utc(res).isValid() && moment.utc(res) || null;
          const threshold = moment.utc().subtract(5, 'minutes');
          if (lastActivityAt && lastActivityAt > threshold) {
            restoreSession(true);
            setAccessToken(hash);
          } else {
            restoreSession();
          }
        }).catch(e => {
          restoreSession();
        });
      } else {
        restoreSession();
      }
    }).catch(e => {
      setIsNewUser(true);
      restoreSession();
    });

    getHidePrePaymentNotice().then(res => {
      setHidePaymentNotice(!!res);
    }).catch(() => {});
  }, []);

  // Initialize app state
  useEffect(() => {
    if(accessToken) {
      writeToStorage(STORAGE_KEYS.LAST_ACTIVITY_AT, moment.utc().format()).catch(() => {});

      getWalletInfo().catch(() => {});

      getContacts().catch(() => {});
      getPayments().catch(() => {});
      getTransactions().catch(() => {});
      getIntegrations().catch(() => {});

      syncDataAndRefresh();

      makeBackgroundRequest(TASKS.CLEAN_TRANSACTIONS).then(items => {
        if(items && Array.isArray(items) && items.length) {
          setTransactions(items);
        }
      }).catch(() => {});
    }
  }, [accessToken]);

  // Auto select right screen after login or logout
  useEffect(() => {
    if (!accessToken && screen !== SCREENS.AUTH) {
      // Switch to Auth
      setScreen(SCREENS.AUTH);
    } else if (accessToken && screen === SCREENS.AUTH) {
      // Switch to Home
      setScreen(SCREENS.HOME);
    }
  }, [screen, accessToken]);

  // Update currency when network changes
  useEffect(() => {
    initializeCurrencyInfo();
  }, [networks]);

  // Validate currency change
  useEffect(() => {
    if (currency) {
      // Validate that currency matches network
      const networkId = networks && networks[0] || null,
        network = getNetworkById(networkId),
        currencySymbol = network && network.nativeCurrency && network.nativeCurrency.symbol,
        chainSymbol = network && network.chain || null;

      if (![currencySymbol, chainSymbol].includes(currency)) {
        initializeCurrencyInfo();
      }
    }
  }, [currency]);

  useEffect(() => {
    dialogRef.current = dialog;
  }, [dialog]);

  const initializeCurrencyInfo = () => {
    const networkId = networks && networks[0] || null,
      network = getNetworkById(networkId),
      currencySymbol = network && network.nativeCurrency && network.nativeCurrency.symbol,
      chainSymbol = network && network.chain || null,
      currencyDecimals = network && network.nativeCurrency && network.nativeCurrency.decimals || null;

    setCurrency(null);
    setRate(0);
    setDecimals(18);

    if (currencySymbol) {
      const updateCurrencyInfo = (symbol, rate = 0) => {
        setCurrency(symbol || currencySymbol);
        setDecimals(currencyDecimals || 18);
        setRate(rate || 0);
      };

      const setAlternativeSymbol = () => {
        // Some testnets use made up symbols
        if (chainSymbol) {
          getPriceData(chainSymbol).then(data => {
            if (data && data[chainSymbol]) {
              const exchangeRate = new Decimal(data && data[chainSymbol] || 0).toNumber() || 0;
              updateCurrencyInfo(chainSymbol, exchangeRate);
            } else {
              updateCurrencyInfo();
            }
          }).catch(e => {
            updateCurrencyInfo();
          });
        } else {
          updateCurrencyInfo();
        }
      };

      getPriceData(currencySymbol).then(data => {
        if (data && data[currencySymbol]) {
          const exchangeRate = new Decimal(data && data[currencySymbol] || 0).toNumber() || 0;
          updateCurrencyInfo(currencySymbol, exchangeRate);
        } else {
          setAlternativeSymbol();
        }
      }).catch(e => {
        setAlternativeSymbol();
      });
    }
  };

  const syncDataAndRefresh = () => {
    makeBackgroundRequest(TASKS.SYNC_GOOGLE_SHEETS).then(() => {
      // Refresh contacts
      getContacts().catch(() => {});
    }).catch(() => {});
  };

  const authenticate = passcode => {
    return getHash().then(storeHashFull => {
      const hash = generateVersionedHash(passcode);
      if (storeHashFull) {
        const {hash :storedHash, version} = decodeVersionedHash(storeHashFull);
        if (bcrypt.compareSync(passcode, storedHash)) {
          setAccessToken(generateVersionedHash(passcode));
          return null;
        } else if(!version && storedHash === generateVersionedHash(passcode, true)) {
          setAccessToken(hash);
          saveHash(hash).catch(() => {});
          return null;
        } else {
          throw new GrinderyError(ERROR_MESSAGES.WRONG_PASSCODE);
        }
      } else {
        // Set hash
        return saveHash(hash).then(res => {
          setAccessToken(hash);
          return null;
        }).catch(e => {
          throw new GrinderyError(e);
        });
      }
    }).catch(e => {
      throw new GrinderyError(e);
    });
  };

  const getWalletInfo = () => {
    const refreshNetwork = localNetworks => {
      makeBackgroundRequest(TASKS.GET_NETWORK).then(res => {
        if (typeof res === 'number') {
          const allNetworks = _.uniq([res, ...(localNetworks || [])]);
          setNetworks(allNetworks);
        }
      }).catch(() => {});
    };

    const refreshAddresses = (localAddresses, localNetworks) => {
      // Refresh addresses
      return makeBackgroundRequest(TASKS.GET_ACCOUNTS).then(res => {
        const items = res && Array.isArray(res) ? res : [];
        if (items.length) {
          const allAddresses = _.uniq([...(items || []), ...(localAddresses || [])]);
          setAddresses(allAddresses);
          refreshNetwork(localNetworks);
          return allAddresses;
        } else {
          return makeBackgroundRequest(TASKS.REQUEST_ACCOUNTS).then(res => {
            const items = res && Array.isArray(res) ? res : [];
            const allAddresses = _.uniq([...(items || []), ...(localAddresses || [])]);
            setAddresses(allAddresses);
            if (items.length) {
              refreshNetwork(localNetworks);
            }
            return allAddresses;
          }).catch(e => {
            throw new GrinderyError(e);
          });
        }
      }).catch(e => {
        return localAddresses;
      });
    };

    return getAddresses().then(res => {
      const localAddresses = _.uniq(res && Array.isArray(res) ? res : []);
      if (localAddresses.length) {
        setAddresses(localAddresses);
      }
      return getNetworks().then(res => {
        const localNetworks = _.uniq(res && Array.isArray(res) ? res : []);
        setNetworks(localNetworks);
        return refreshAddresses(localAddresses, localNetworks);
      }).catch(e => {
        return refreshAddresses(localAddresses, []);
      });
    }).catch(e => {
      setAddresses([]);
      throw new GrinderyError(e);
    });
  };

  const getNetworkById = id => {
    return (chains || []).find(i => id && i && i.chainId === id) || null;
  };

  const getContacts = () => {
    return readFromStorage(STORAGE_KEYS.CONTACTS).then(res => {
      const items = deduplicateContacts(res && Array.isArray(res) ? res : []);
      setContacts(items);
      return items;
    }).catch(e => {
      setContacts([]);
      throw new GrinderyError(e);
    });
  };

  const getPayments = () => {
    return readFromStorage(STORAGE_KEYS.PAYMENTS).then(res => {
      const items = deduplicatePayments((res && Array.isArray(res) ? res : []).filter(i => i.address));
      setPayments(items);
      return items;
    }).catch(e => {
      setPayments([]);
      throw new GrinderyError(e);
    });
  };

  const getTransactions = () => {
    return readFromStorage(STORAGE_KEYS.TRANSACTIONS).then(res => {
      const items = res && Array.isArray(res) ? res : [];
      setTransactions(items);
      return items;
    }).catch(e => {
      setTransactions([]);
      throw new GrinderyError(e);
    });
  };

  const getIntegrations = () => {
    return readFromStorage(STORAGE_KEYS.INTEGRATIONS).then(res => {
      const item = res || {};
      setIntegrations(item);
      return item;
    }).catch(e => {
      setIntegrations(0);
      throw new GrinderyError(e);
    });
  };

  const convertToCrypto = amount => {
    return new Decimal(amount || 0).times(rate || 0).toFixed(4);
  };

  const convertToPayableCrypto = amount => {
    return new Decimal(10).pow(decimals || 18).times(amount || 0).times(rate || 0).toFixed(0);
  };

  const convertPayableToDisplayValue = value => {
    const networkId = networks && networks[0] || null,
      network = getNetworkById(networkId);
    if(value && network) {
      const decimals = network && network.nativeCurrency && network.nativeCurrency.decimals || null;
      return new Decimal(value || 0).dividedBy(new Decimal(10).pow(decimals || 18).toNumber()).toFixed(4);
    }
    return 0;
  };

  const convertToFiat = value => {
    let decimalFiat = new Decimal(0);
    const decimalValue = new Decimal(value || 0),
      decimalRate = new Decimal(rate || 0);
    if(decimalValue.gt(0) && decimalRate.gt(0)) {
      decimalFiat = decimalValue.dividedBy(decimalRate);
    }
    return decimalFiat.toFixed(2);
  };

  const addContact = data => {
    const existingContactIds = (contacts || []).map(i => contactComparator(i));
    const newItems = deduplicateContacts([
      ...existingContactIds.includes(contactComparator(data)) ? [] : [data],
      ...(contacts || [])
    ]);
    return writeToStorage(STORAGE_KEYS.CONTACTS, newItems).then(res => {
      setContacts(newItems);

      syncDataAndRefresh();

      return null;
    }).catch(e => {
      throw new GrinderyError(e, ERROR_MESSAGES.SAVE_FAILED);
    });
  };

  const addContacts = data => {
    if (data && Array.isArray(data)) {
      const existingContactIds = (contacts || []).map(i => contactComparator(i));
      const newItems = deduplicateContacts([
        ...(data || []).filter(i => !existingContactIds.includes(contactComparator(i))),
        ...(contacts || [])
      ]);
      return writeToStorage(STORAGE_KEYS.CONTACTS, newItems).then(res => {
        setContacts(newItems);
        return null;
      }).catch(e => {
        throw new GrinderyError(e, ERROR_MESSAGES.SAVE_FAILED);
      });
    } else {
      throw new GrinderyError(ERROR_MESSAGES.INVALID_INPUT);
    }
  };

  const addPayment = (data) => {
    const newItems = deduplicatePayments([data, ...payments]);
    return writeToStorage(STORAGE_KEYS.PAYMENTS, newItems).then(res => {
      setPayments(newItems);

      syncDataAndRefresh();

      return null;
    }).catch(e => {
      throw new GrinderyError(e, ERROR_MESSAGES.SAVE_FAILED);
    });
  };

  const addPayments = data => {
    if (data && Array.isArray(data)) {
      const newItems = deduplicatePayments([...(data || []), ...(payments || [])]);
      writeToStorage(STORAGE_KEYS.PAYMENTS, newItems).then(res => {
        setPayments(newItems);
        return null;
      }).catch(e => {
        throw new GrinderyError(e, ERROR_MESSAGES.SAVE_FAILED);
      });
    } else {
      throw new GrinderyError(ERROR_MESSAGES.INVALID_INPUT);
    }
  };

  const addIntegration = (provider, data) => {
    let newIntegrations = {...(integrations || {}), [provider]: data};
    return writeToStorage(STORAGE_KEYS.INTEGRATIONS, newIntegrations).then(res => {
      setIntegrations(newIntegrations);
      return null;
    }).catch(e => {
      throw new GrinderyError(e, ERROR_MESSAGES.SAVE_FAILED);
    });
  };

  const removeIntegration = provider => {
    let newIntegrations = {...(integrations || {})};
    delete newIntegrations[provider];
    return writeToStorage(STORAGE_KEYS.INTEGRATIONS, newIntegrations).then(res => {
      setIntegrations(newIntegrations);
      return null;
    }).catch(e => {
      throw new GrinderyError(e, ERROR_MESSAGES.SAVE_FAILED);
    });
  };

  return (
    <AppContext.Provider value={{
      ...defaultAppState,
      // Data
      isNewUser,
      hidePaymentNotice,
      accessToken,
      screen,
      dialog,
      addresses,
      networks,
      currency,
      contacts,
      payments,
      transactions,
      integrations,

      // Actions
      authenticate,
      logOut: () => setAccessToken(null),
      changeScreen: (screen, action = null, data = null) => {
        setScreen(screen);
        if (action) {
          setDialog({action, data});
        }
      },
      openDialog: (action, data) => {
        let cleanedAction = action,
          cleanedData = data;
        if (typeof cleanedAction === 'object') {
          cleanedAction = cleanedAction.action;
          cleanedData = {..._.omit(action || {}, ['action']), ...(data || {})};
        }
        setDialog({action: cleanedAction, data: cleanedData});
      },
      closeDialog: () => {
        setDialog(null);
      },
      addNotification: (title, type='success') => {
        if(title && (!dialogRef.current || dialogRef.current.action !== DIALOG_ACTIONS.MAKE_PAYOUT)) {
          setNotifications([{title, type},...(notifications || [])]);
        }
      },
      updateHidePaymentNotice: () => {
        setHidePaymentNotice(true);
        setHidePrePaymentNotice().catch(() => {});
      },
      // Wallet
      getWalletInfo,
      getNetworkById,
      convertToCrypto,
      convertToPayableCrypto,
      convertPayableToDisplayValue,
      convertToFiat,
      // Contacts
      getContacts,
      addContact,
      addContacts,
      // Payments
      getPayments,
      addPayment,
      addPayments,
      // Transactions
      getTransactions,
      // Integrations
      getIntegrations,
      addIntegration,
      removeIntegration,
    }}>
      <div className={classes.container}>
        <ErrorBoundary>
          <TitleBar/>
        </ErrorBoundary>
        {accessToken && notifications.length && (
          <ErrorBoundary>
            {notifications.filter(i => i.title).map((notification, idx) => (
              <Alert severity={notification.type || 'success'}
                     onClose={() => {
                       if(notifications.length) {
                         setNotifications([...notifications.slice(0, idx), ...notifications.slice(idx+1)]);
                       }
                     }}>
                {notification.title}
              </Alert>
            ))}
          </ErrorBoundary>
        ) || null}

        <div className={clsx(classes.mainContent, {
          [classes.mainContentGreyBg]: [SCREENS.HOME, SCREENS.CONTACTS, SCREENS.PAYMENTS, SCREENS.TRANSACTIONS].includes(screen),
          [classes.mainContentNoPadding]: [SCREENS.CONTACTS, SCREENS.PAYMENTS].includes(screen),
        })}>
          <ErrorBoundary>
            {sessionInitialized && (
              <ContentRouter/>
            ) || (
              <div className={classes.loading}>
                <CircularProgress size={30}/>
              </div>
            )}
          </ErrorBoundary>
        </div>

        <ErrorBoundary>
          <TabBar/>
        </ErrorBoundary>

        <ErrorBoundary>
          <DialogRouter/>
        </ErrorBoundary>
      </div>
    </AppContext.Provider>
  );
}
