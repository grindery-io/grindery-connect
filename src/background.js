/*global chrome*/
import Web3 from 'web3';
import moment from 'moment';

import {
  MESSAGE_TYPES,
  NOTIFICATIONS,
  TASKS,
  CUSTOM_TOKENS,
  WALLET_EVENTS,
  WALLET_OPTIONS,
  NETWORKS, ADDRESS_ZERO
} from './helpers/contants';
import {getAccounts, getBalance, getNetwork, requestAccounts} from './helpers/metamask';
import {
  getTransactions,
  saveAddresses,
  saveNetwork,
  saveSnapshot,
  saveTransaction,
  saveTransactions,
  saveWalletAddress
} from './helpers/storage';
import {
  getWeb3Instance,
  sendExtensionEvent,
  sendExtensionNotification,
  syncContactsWithGoogleSheets
} from './helpers/routines';
import {ERROR_MESSAGES} from './helpers/errors';
import {getNetworkExplorerUrl, getPaymentsTotal} from './helpers/utils';

import contracts from './helpers/contracts.json';

const isPopUpOpen = () => {
  const popups = chrome.extension.getViews({ type: 'popup' });
  return popups && Array.isArray(popups) && popups.length;
};

chrome.browserAction.onClicked.addListener((tab) => {
  if(tab && tab.id) {
    chrome.tabs.executeScript(tab.id,{
      file: 'content.js'
    }, () => {
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if(chrome.runtime.lastError) {
    console.error('onMessage chrome.runtime.lastError => ', chrome.runtime.lastError.message || chrome.runtime.lastError);
    return;
  }

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

  if(message && message.type === MESSAGE_TYPES.TASK) {
    const task = message && message.task || null,
      payload = message && message.payload || null;
    if(task) {
      const web3 = getWeb3Instance();
      switch (task) {
        case TASKS.REQUEST_ACCOUNTS: {
          requestAccounts(web3)
            .then(accounts => {
              sendSuccessResponse(accounts);
              saveAddresses(accounts).catch(() => {});
            })
            .catch(e => sendErrorResponse(e));
          return true;
        }
        case TASKS.GET_ACCOUNTS: {
          getAccounts(web3)
            .then(accounts => {
              sendSuccessResponse(accounts);
              saveAddresses(accounts).catch(() => {});
            })
            .catch(e => sendErrorResponse(e));
          return true;
        }
        case TASKS.LISTEN_FOR_WALLET_EVENTS: {
          const {events} = payload || {};
          if(web3.currentProvider && events && Array.isArray(events) && events.length) {
            for (const eventName of events) {
              web3.currentProvider.on(eventName, res => {
                sendExtensionEvent(eventName, {data: res}).catch(() => {});
              });
            }
          }
          return false;
        }
        case TASKS.GET_NETWORK: {
          getNetwork(web3)
            .then(network => {
              sendSuccessResponse(network);
              saveNetwork(network).catch(() => {});
            })
            .catch(e => sendErrorResponse(e));
          return true;
        }
        case TASKS.GET_BALANCE: {
          const {address} = payload || {};
          if(address) {
            getBalance(address, web3)
              .then(balance => sendSuccessResponse(balance))
              .catch(e => sendErrorResponse(e));
            return true;
          }
          sendErrorResponse(ERROR_MESSAGES.INVALID_WALLET_ADDRESS);
          break;
        }
        case TASKS.MAKE_PAYOUT: {
          const paidAt = moment.utc().format();
          if(payload) {
            const { from, to, value, abi, contractAddress, data, meta, snapshot, paymentMethod } = payload || {};
            if(from && value) {
              let walletCall = null,
                errorMessage = '';
              if(abi && contractAddress && data) {
                // Contract Payout
                const contract = new web3.eth.Contract(abi, contractAddress);
                const batchTransferArguments = data || [];
                const contractCall = contract && contract.methods && (contract.methods.batchTransfer || contract.methods.payout);

                if(contractCall) {
                  walletCall = contractCall(...batchTransferArguments).send({
                    from,
                    value: Web3.utils.toHex(
                      paymentMethod !== WALLET_OPTIONS.SMART?0:value
                    ),
                  });
                } else {
                  errorMessage = ERROR_MESSAGES.NETWORK_BATCH_NOT_SUPPORTED;
                }
              } else if(to) {
                // Direct Payout
                walletCall = web3.eth.sendTransaction({
                  from,
                  to,
                  value: Web3.utils.toHex(value),
                });
              }

              if(walletCall) {
                let confirmationsReceived = 0;
                walletCall.on('transactionHash', (hash => {
                  // Transaction has been sent
                  saveTransaction({
                    ...meta,
                    hash,
                    confirmed: false,
                    paid_at: paidAt,
                  }).then(() => {
                    sendExtensionNotification(NOTIFICATIONS.PAYOUT_INITIATED, {
                      hash,
                    }).catch(() => {});
                  }).catch(() => {});
                  sendSuccessResponse(hash);

                  if(!isPopUpOpen() && snapshot) {
                    saveSnapshot({
                      ...snapshot,
                      state: {
                        hash,
                        processing: true,
                        sent: true,
                      }
                    }).catch(() => {});
                  }
                })).on('confirmation', ((confirmationNumber, receipt) => {
                  confirmationsReceived += 1;
                  if(receipt && receipt.transactionHash) {
                    if(confirmationsReceived < 2) {
                      saveTransaction({
                        ...meta,
                        hash: receipt.transactionHash,
                        confirmed: true,
                        paid_at: paidAt,
                      }).catch(() => {});

                      sendExtensionNotification(NOTIFICATIONS.PAYOUT_COMPLETED, {
                        hash: receipt.transactionHash,
                        receipt,
                      }).catch(() => {});

                      if(!isPopUpOpen() && snapshot) {
                        saveSnapshot({
                          ...snapshot,
                          state: {
                            hash: receipt.transactionHash,
                            paid: true,
                          }
                        }).catch(() => {});
                      }
                    }
                  }
                })).on('receipt', (receipt => {
                  // Receipt
                })).on('error', ((error, receipt) => {
                  sendErrorResponse();
                  if(receipt && receipt.transactionHash) {
                    sendExtensionNotification(NOTIFICATIONS.PAYOUT_FAILED, {
                      hash: receipt.transactionHash,
                      error,
                      receipt,
                    }).catch(() => {});

                    if(!isPopUpOpen() && snapshot) {
                      saveSnapshot({
                        ...snapshot,
                        state: {
                          hash: receipt.transactionHash,
                          error: 'Failed to make paymnet',
                        }
                      }).catch(() => {});
                    }
                  }
                })).then(res => {
                  if(res && res.transactionHash) {
                    saveTransaction({
                      ...meta,
                      hash: res.transactionHash,
                      confirmed: true,
                      paid_at: paidAt,
                    }).catch(() => {});

                    sendExtensionNotification(NOTIFICATIONS.PAYOUT_COMPLETED, {
                      hash: res.transactionHash,
                      receipt: res,
                    }).catch(() => {});

                    if(!isPopUpOpen()) {
                      if(snapshot) {
                        saveSnapshot({
                          ...snapshot,
                          state: {
                            hash: res.transactionHash,
                            paid: true,
                          }
                        }).catch(() => {});
                      }

                      if(meta && (meta.payments || meta.payment)) {
                        let payments = [];
                        if(meta.payments && Array.isArray(meta.payments) && meta.payments.length) {
                          payments = meta.payments;
                        } else if(meta.payment) {
                          payments = [meta.payment];
                        }

                        if(payments.length) {
                          const fiatTotal = getPaymentsTotal(payments),
                            numRecipients = payments.length;
                          const explorerUrl = meta.chain && getNetworkExplorerUrl(meta.chain) || null;
                          chrome.notifications.create(explorerUrl && `${explorerUrl}/tx/${encodeURIComponent(res.transactionHash || '')}` || '', {
                            title: 'Payment completed',
                            message: `$${fiatTotal} to ${numRecipients} recipient${numRecipients === 1?'':'s'}`,
                            iconUrl: chrome.runtime.getURL('logo.png'),
                            type: 'basic'
                          }, () => {});
                        }
                      }
                    }
                  }
                }).catch(e => {
                  console.error('failed to make payout => ', e);
                });;
                return true;
              } else {
                sendErrorResponse(errorMessage);
                return true;
              }
            }
          }
          break;
        }
        case TASKS.SYNC_GOOGLE_SHEETS: {
          syncContactsWithGoogleSheets().then(() => {
            sendSuccessResponse('synced');
          }).catch(e => {
            sendErrorResponse(e);
          });
          return true;
        }
        case TASKS.CLEAN_TRANSACTIONS: {
          getTransactions().then(async res => {
            const allTransactions = (res && Array.isArray(res) ? res : []);
            const pendingTransactions = allTransactions.filter(i => typeof i.confirmed === 'boolean' && !i.confirmed);
            let completedTransactions = [];
            if (web3 && pendingTransactions.length) {
              for (const transaction of pendingTransactions) {
                if (transaction && transaction.hash) {
                  const receipt = await web3.eth.getTransactionReceipt(transaction.hash).catch(() => {});
                  if (receipt && receipt.status) {
                    completedTransactions.push(transaction.hash);
                  }
                }
              }
            }
            if (completedTransactions.length) {
              let newTransactions = (allTransactions || []).map(i => {
                if (completedTransactions.includes(i.hash)) {
                  return {
                    ...i,
                    confirmed: true,
                  }
                }
                return i;
              });
              saveTransactions(newTransactions).then(() => {}).catch(() => {});
            }
            sendSuccessResponse(allTransactions);
          }).catch(e => {
            sendErrorResponse(e);
          });
          return true;
        }
        case TASKS.CREATE_WALLET: {
          const { account, chain, smartWallets, stableCoin, terraAddress } = payload || {};
          const contractDetails = chain && contracts && contracts.wallet && contracts.wallet[chain];
          const { bytecode, swap, bridge, bridge_erc20, bridge_terra } = contractDetails && contractDetails;

          if(account && chain && [
            NETWORKS.HARMONY_TESTNET.chainId,
            NETWORKS.KOVAN.chainId,
            NETWORKS.ROPSTEN.chainId,
          ].includes(chain) && bytecode) {
            let constructorArgs = [];

            if(chain === NETWORKS.KOVAN.chainId) {
              constructorArgs = [
                smartWallets[NETWORKS.HARMONY_TESTNET.chainId] || account, // _bridgeLockRecipient
                bridge, // _bridgeLockContractAddress
                bridge_erc20, // _bridgeLockERC20ContractAddress
              ];
            }

            if(chain === NETWORKS.HARMONY_TESTNET.chainId) {
              const getTokenAddress = symbol => {
                return contracts && contracts.token && contracts.token[symbol] &&
                  contracts.token[symbol].chains && contracts.token[symbol].chains[chain] || ADDRESS_ZERO;
              };

              constructorArgs = [
                smartWallets[NETWORKS.KOVAN.chainId] || account, // _bridgeBurnRecipient
                bridge_erc20, // _bridgeBurnERC20ContractAddress
                terraAddress || Web3.utils.toHex(""), // _bridgeBurnTerraRecipient
                bridge_terra, // _bridgeBurnTerraERC20ContractAddress
                swap, // _swapContractAddress
                getTokenAddress(stableCoin || 'UST'), // _swapTokenAddress
                getTokenAddress('1ETH') // _swapToBridgeTokenAddress
              ];
            }

            const transactionArgs = {
              from: account,
              data: bytecode,
              arguments: constructorArgs,
            };
            const walletCall = web3.eth.sendTransaction(transactionArgs);
            let confirmationsReceived = 0;
            walletCall.on('transactionHash', (hash => {
              // Transaction has been sent
              sendExtensionNotification(NOTIFICATIONS.CREATE_WALLET_INITIATED, {
                hash,
              }).catch(() => {});

              sendSuccessResponse(hash);
            })).on('confirmation', ((confirmationNumber, receipt) => {
              confirmationsReceived += 1;
              if(receipt && receipt.contractAddress) {
                if(confirmationsReceived < 2) {
                  // save new wallet
                  saveWalletAddress(chain, receipt.contractAddress).catch(() => {});

                  sendExtensionNotification(NOTIFICATIONS.CREATE_WALLET_COMPLETED, {
                    hash: receipt.transactionHash,
                    contractAddress: receipt.contractAddress,
                    receipt,
                  }).catch(() => {});
                }
              }
            })).on('receipt', (receipt => {
              // Receipt
              if(receipt && receipt.contractAddress) {
                saveWalletAddress(chain, receipt.contractAddress).catch(() => {});
              }
            })).on('error', ((error, receipt) => {
              sendErrorResponse();
              if(receipt && receipt.transactionHash) {
                sendExtensionNotification(NOTIFICATIONS.CREATE_WALLET_FAILED, {
                  hash: receipt.transactionHash,
                  error,
                  receipt,
                }).catch(() => {});
              }
            })).then(res => {
              if(res && res.contractAddress) {
                // save new wallet address
                saveWalletAddress(chain, res.contractAddress).catch(e => {
                  console.error('failed to save wallet => ', e);
                });

                sendExtensionNotification(NOTIFICATIONS.CREATE_WALLET_COMPLETED, {
                  hash: res.transactionHash,
                  contractAddress: res.contractAddress,
                  receipt: res,
                }).catch(() => {});

                if(!isPopUpOpen()) {
                  chrome.notifications.create('', {
                    title: 'Smart Wallet created',
                    message: 'Your smart wallet has been created',
                    iconUrl: chrome.runtime.getURL('logo.png'),
                    type: 'basic'
                  }, () => {});
                }
              }
            });
            return true;
          }
          break;
        }
        case TASKS.CHANGE_NETWORK: {
          const { chain } = payload || {}, provider = web3.currentProvider;
          if(chain && provider) {
            provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{
                chainId: Web3.utils.toHex(chain)
              }],
            }).then(res => {
              sendSuccessResponse(chain);
            }).catch(e => {
              sendErrorResponse();
            });
            return true;
          }
          break;
        }
        case TASKS.GET_TOKEN_BALANCE: {
          const {address, token, chain} = payload || {};
          const erc20abi = contracts && contracts.erc20 && contracts.erc20.abi,
            tokenAddress = contracts && contracts.token && contracts.token[token] && contracts.token[token].chains && contracts.token[token].chains[chain];
          if(address && token && chain && erc20abi && tokenAddress) {
            const tokenAddress = contracts.token[token].chains[chain];
            const contract = new web3.eth.Contract(erc20abi, tokenAddress);
            if(contract && contract.methods && contract.methods.balanceOf) {
              contract.methods.balanceOf(address).call().then(res => {
                sendSuccessResponse(res);
              }).catch(e => {
                sendErrorResponse();
              });
              return true;
            }
          }
          break;
        }
        default: {
          break;
        }
      }
    }
    sendErrorResponse();
  }
});

chrome.notifications.onClicked.addListener(notificationId => {
  if(/^[\w]+:\/\//i.test(notificationId)) {
    chrome.tabs.create({ url: notificationId });
  }
});
