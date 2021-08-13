import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
} from '@material-ui/core';
import {Cancel as CancelIcon, CheckCircle as CheckCircleIcon} from '@material-ui/icons';
import clsx from 'clsx';
import Web3 from 'web3';

import Dialog, {useStyles as dialogStyles} from '../containers/Dialog';

import AppContext from '../../AppContext';

import {NOTIFICATIONS, TASKS} from '../../helpers/contants';
import {getPaymentsTotal} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {listenForExtensionNotification, makeBackgroundRequest} from '../../helpers/routines';

import contracts from '../../helpers/contracts.json';

const useStyles = makeStyles((theme) => ({
  bold: {
    fontWeight: 'bold',
  },
  statusWrapper: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'center',
    marginBottom: theme.spacing(2.5),
    '& > *:last-child:not(:first-child)': {
      marginTop: theme.spacing(1.25),
    }
  },
  statusProcessing: {
    fontSize: 14,
  },
  statusSuccess: {
    color: theme.palette.success.main,
  },
  statusError: {
    color: theme.palette.error.main,
  },
  statusIcon: {
    fontSize: 50,
  },
  payoutSubheader: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'center',
    marginBottom: theme.spacing(1.25),
  },
  payoutRecipients: {
    fontSize: 42,
    fontWeight: 'normal',
    lineHeight: 1,
    textAlign: 'center',
    marginBottom: theme.spacing(1.25),
  },
  payoutDetails: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.6,
    textAlign: 'center',
    borderTop: '1px solid #D3DEEC',
    paddingTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  checkboxLabel: {
    fontSize: 14,
  }
}));

export default ({payments, nextDialog, state}) => {
  const classes = useStyles();
  const dialogClasses = dialogStyles();

  const {hidePaymentNotice, screen, dialog, addresses, networks, currency, openDialog, closeDialog, addNotification, convertToCrypto, convertToPayableCrypto, convertPayableToDisplayValue, convertToFiat, getTransactions, updateHidePaymentNotice} = useContext(AppContext);

  const [processing, setProcessing] = useState(state && state.processing || false);
  const [sent, setSent] = useState(state && state.sent || false);
  const [paid, setPaid] = useState(state && state.paid || false);
  const [error, setError] = useState(state && state.error || null);
  const [balance, setBalance] = useState(state && state.balance || 0);
  const [showNotice, setShowNotice] = useState(false);
  const [disableNotice, setDisableNotice] = useState(false);

  const address = addresses && addresses[0] || '',
    networkId = networks && networks[0] || null,
    fiatTotal = getPaymentsTotal(payments),
    cryptoTotal = convertToCrypto(fiatTotal),
    numRecipients = (payments || []).length,
    cryptoBalance = convertPayableToDisplayValue(balance || 0),
    fiatBalance = convertToFiat(cryptoBalance),
    ERROR_PAYMENT_FAILED = `Failed to pay ${numRecipients} recipient${numRecipients === 1 ? '' : 's'}`;

  useEffect(() => {
    if (address) {
      makeBackgroundRequest(TASKS.GET_BALANCE, {address}).then(balance => {
        setBalance(balance);
      }).catch(() => {
      });
    }
  }, [address]);

  useEffect(() => {
    if ((paid || error) && processing) {
      setProcessing(false);
    }
  }, [paid, error]);

  const listenForTransactionEvents = transactionHash => {
    listenForExtensionNotification([
      NOTIFICATIONS.PAYOUT_INITIATED,
      NOTIFICATIONS.PAYOUT_COMPLETED,
      NOTIFICATIONS.PAYOUT_FAILED
    ], (event, payload) => {
      if (payload && transactionHash === payload.hash) {
        switch (event) {
          case NOTIFICATIONS.PAYOUT_COMPLETED: {
            setPaid(true);
            addNotification(`Payment completed: $${fiatTotal} to ${numRecipients} recipient${numRecipients === 1 ? '' : 's'}`);
            break;
          }
          case NOTIFICATIONS.PAYOUT_FAILED: {
            setError(payload.message || ERROR_PAYMENT_FAILED);
            break;
          }
          default: {
            break;
          }
        }

        // Refresh transactions
        getTransactions().catch(() => {
        });
      }
    });
  };

  useEffect(() => {
    if (state && state.hash) {
      if (!state.paid || !state.error) {
        // Listen for events on resume
        listenForTransactionEvents(state.hash);
      }
    }
  }, []);

  const onPay = () => {
    setProcessing(true);
    setSent(false);
    setPaid(false);
    setError(null);

    let paymentPayload = null,
      paymentError = null;

    if (address) {
      if (payments.length === 1) {
        // Compose single payment payload
        const payment = payments && payments[0] || null,
          to = payment && payment.address || null,
          fiatAmount = payment && payment.amount || null,
          cryptoValue = fiatAmount && convertToPayableCrypto(fiatAmount) || null;

        if (to && cryptoValue) {
          paymentPayload = {
            from: address,
            to,
            value: Web3.utils.toHex(cryptoValue),
            meta: {
              from: address,
              to,
              value: cryptoValue,
              chain: networkId,
              currency,
              payment,
            },
            snapshot: {
              screen,
              dialog
            }
          };
        }
      } else if (payments.length >= 2) {
        // Compose multiple payment payload
        const {abi, address: contractAddress} = contracts && contracts[networkId] || {};
        if (abi && contractAddress) {
          const abiPayout = (abi || []).find(i => i.name === 'payout');
          const abiPayoutArgs = (abiPayout && abiPayout.inputs || []).map(i => i.name) || [];

          const isMultiTokenContract = abiPayoutArgs.includes('tokenPointers') && abiPayoutArgs.includes('tokenAddresses');

          let cryptoValueTotal = convertToPayableCrypto(fiatTotal),
            recipients = [],
            rawValues = [],
            values = [],
            tokenPointers = [],
            tokenAddresses = [];

          for (const payment of (payments || [])) {
            const to = payment && payment.address || null,
              fiatAmount = payment && payment.amount || null,
              cryptoValue = fiatAmount && convertToPayableCrypto(fiatAmount) || null;

            recipients.push(to);
            rawValues.push(cryptoValue);
            values.push(Web3.utils.toHex(cryptoValue));

            if (isMultiTokenContract) {
              tokenPointers.push(Web3.utils.toHex(0));
            }
          }

          let payoutArguments = [recipients, values];
          if (isMultiTokenContract) {
            payoutArguments = payoutArguments.concat([tokenPointers, tokenAddresses]);
          }

          paymentPayload = {
            from: address,
            value: Web3.utils.toHex(cryptoValueTotal),
            abi,
            contractAddress,
            data: payoutArguments,
            meta: {
              from: address,
              to: contractAddress,
              value: cryptoValueTotal,
              chain: networkId,
              currency,
              recipients,
              values: rawValues,
              payments,
            },
            snapshot: {
              screen,
              dialog
            }
          };
        } else {
          paymentError = ERROR_MESSAGES.NETWORK_BATCH_NOT_SUPPORTED;
        }
      }
    } else {
      paymentError = ERROR_MESSAGES.METAMASK_AUTH_REQUIRED;
    }

    if (paymentPayload) {
      makeBackgroundRequest(TASKS.MAKE_PAYOUT, paymentPayload).then(hash => {
        if (hash) {
          setSent(true);
          // Refresh transactions
          getTransactions().catch(() => {
          });

          listenForTransactionEvents(hash);
        } else {
          setError(ERROR_PAYMENT_FAILED);
        }
      }).catch(e => {
        setError((e && typeof e === 'string' && e) || ERROR_PAYMENT_FAILED);
      });
    } else {
      setError(paymentError || ERROR_PAYMENT_FAILED)
    }
  };

  const onPayOrShowConfirm = () => {
    if(hidePaymentNotice) {
      onPay();
    } else {
      setShowNotice(true);
    }
  };

  const onContinue = () => {
    setShowNotice(false);
    if(!hidePaymentNotice && disableNotice) {
      updateHidePaymentNotice();
    }
    onPay();
  };

  return (
    <Dialog title="Payout Details"
            ariaLabel="payout details"
            className={dialogClasses.dialogTall}
            actions={(
              <>
                <Button type="button"
                        color="secondary"
                        variant="contained"
                        disabled={!address || paid || processing || cryptoTotal > cryptoBalance}
                        onClick={onPayOrShowConfirm}>
                  Pay
                </Button>
                <Button type="button"
                        color="secondary"
                        variant="outlined"
                        disabled={processing && !sent}
                        onClick={() => {
                          if (nextDialog) {
                            openDialog(nextDialog);
                          } else {
                            closeDialog();
                          }
                        }}>
                  {(paid || sent) && 'Close' || 'Cancel'}
                </Button>
              </>
            )}>

      {(processing || paid || error) && (
        <div className={clsx(classes.statusWrapper, {
          [classes.statusProcessing]: processing && sent,
          [classes.statusSuccess]: paid,
          [classes.statusError]: error,
        })}>
          {processing && (
            <>
              <CircularProgress size={sent ? 32 : 42} color="secondary"/>
              <div>
                {sent && (
                  <>
                    <div>Your transaction is processing.</div>
                    <div>This might take several minutes.</div>
                    <div>You can close this dialog below and continue using the app in the meantime.</div>
                  </>
                ) || (
                  <>Initiating payment ...</>
                )}
              </div>
            </>
          ) || (
            paid && (
              <>
                <CheckCircleIcon className={classes.statusIcon}/>
                <div>Paid {numRecipients} recipient{numRecipients === 1 ? '' : 's'}</div>
              </>
            ) || (
              <>
                <CancelIcon className={classes.statusIcon}/>
                <div>{error || ERROR_PAYMENT_FAILED}</div>
              </>
            )
          )}
        </div>
      ) || (
        <>
          <div className={classes.payoutSubheader}>
            Total Recipients
          </div>
          <div className={classes.payoutRecipients}>
            {numRecipients}
          </div>
        </>
      )}

      <Grid container
            direction="row"
            justify="space-between"
            wrap="nowrap"
            className={classes.payoutDetails}>
        <div>Total</div>
        <div className={classes.bold} style={{textAlign: 'right'}}>
          <div>${fiatTotal}</div>
          {currency && (
            <div>{cryptoTotal}{' '}{currency}</div>
          ) || null}
        </div>
      </Grid>

      <Grid container
            direction="row"
            justify="space-between"
            wrap="nowrap"
            className={classes.payoutDetails}>
        <div>Balance</div>
        <div className={classes.bold} style={{textAlign: 'right'}}>
          <div>${fiatBalance}</div>
          {currency && (
            <div>{cryptoBalance}{' '}{currency}</div>
          ) || null}
        </div>
      </Grid>

      {showNotice && (
        <Dialog actions={(
          <Button type="button"
                  color="secondary"
                  variant="contained"
                  onClick={onContinue}>
            Continue
          </Button>
        )}>
          <div>For security reasons Metamask will close the Grindery Extension window.</div>
          <div>Simply confirm the transaction in Metamask then reopen Grindery.</div>

          {!hidePaymentNotice && (
            <FormControlLabel label="Don't show this again."
                              classes={{
                                label: classes.checkboxLabel
                              }}
                              control={(
                                <Checkbox color="secondary"
                                          checked={disableNotice}
                                          onChange={() => setDisableNotice(!disableNotice)}/>
                              )}/>
          ) || null}
        </Dialog>
      ) || null}
    </Dialog>
  );
};