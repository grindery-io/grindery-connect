import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Button, Card, CardContent, IconButton, Typography} from '@material-ui/core';
import {Add as AddIcon} from '@material-ui/icons';
import clsx from 'clsx';

import AppContext from '../../AppContext';

import {DIALOG_ACTIONS, SCREENS, TASKS} from '../../helpers/contants';
import {getPendingPayments, getPaymentsTotal} from '../../helpers/utils';
import {makeBackgroundRequest} from '../../helpers/routines';

import contactsLighter from '../../images/contacts-lighter.svg';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  card: {
    textAlign: 'left',
    marginBottom: theme.spacing(2.5),
    borderRadius: 10,
    boxShadow: 'inset 0 1px 0px rgba(0, 0, 0, 0.1), inset -1px 0 0 rgba(0, 0, 0, 0.1), inset 0 -1px 0px rgba(0, 0, 0, 0.1), inset 1px 0 0 rgba(0, 0, 0, 0.1)',
    '&:last-child': {
      marginBottom: 0,
    },
    '& button': {
      fontSize: 12,
      lineHeight: 1.5,
      //borderRadius: 100,
    },
    '& button.disabled': {
      cursor: 'not-allowed',
    }
  },
  cardContent: {
    position: 'relative',
    padding: theme.spacing(2),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 1.5,
    color: '#0B0D17',
    marginBottom: theme.spacing(1.25),
    opacity: 0.6,
  },
  cardAction: {
    position: 'absolute',
    top: theme.spacing(0.5),
    right: theme.spacing(0.5),
  },
  cardAmount: {
    fontSize: 40,
    fontWeight: 300,
    lineHeight: 1,
    //marginBottom: theme.spacing(1.25),
    marginBottom: 0,
  },
  cardAmountSmall: {
    fontSize: 12,
    fontWeight: 300,
    lineHeight: 1,
    //marginBottom: theme.spacing(1.25),
    marginTop: theme.spacing(1.25),
    marginBottom: 0,
  },
  cardAmountLight: {
    opacity: 0.4,
  },
  cardAmountIcon: {
    display: 'inline-block',
    height: 22,
    fill: '#DADADA',
    marginRight: theme.spacing(1),
    verticalAlign: 'baseline',
  }
}));

export default () => {
  const classes = useStyles();
  const {currency, addresses, networks, contacts, payments, transactions, changeScreen, convertToCrypto, convertPayableToDisplayValue, convertToFiat, getTransactions} = useContext(AppContext);

  const [balance, setBalance] = useState(0);

  const address = addresses && addresses[0] || '',
    networkId = networks && networks[0] || null,
    cryptoBalance = convertPayableToDisplayValue(balance || 0),
    fiatBalance = convertToFiat(cryptoBalance);

  useEffect(() => {
    getTransactions().catch(() => {});
  }, []);

  useEffect(() => {
    if (address) {
      makeBackgroundRequest(TASKS.GET_BALANCE, {address}).then(balance => {
        setBalance(balance);
      }).catch(() => {
      });
    }
  }, [address, networkId]);

  const renderAmount = amount => {
    const parts = (amount || '').toString().split('.');
    return (
      <>
        <span className={classes.cardAmountLight}>$</span>
        <span>{parts[0] || 0}.</span>
        <span className={classes.cardAmountLight}>{parts[1] || '00'}</span>
      </>
    );
  };

  const pendingPayments = getPendingPayments(payments, transactions),
    fiatTotal = getPaymentsTotal(pendingPayments),
    cryptoTotal = convertToCrypto(fiatTotal);

  return (
    <div className={classes.container}>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h6" component="h3" className={classes.cardTitle}>
            Contacts
          </Typography>
          <Typography gutterBottom variant="h2" component="h2" className={classes.cardAmount}>
            <img src={contactsLighter} className={classes.cardAmountIcon} height={18}/>
            <span>{contacts && contacts.length || 0}</span>
          </Typography>

          <IconButton color="secondary"
                      className={classes.cardAction}
                      onClick={() => changeScreen(SCREENS.CONTACTS, DIALOG_ACTIONS.ADD_CONTACT)}>
            <AddIcon/>
          </IconButton>
        </CardContent>
      </Card>

      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h6" component="h3" className={classes.cardTitle}>
            Pending payments
          </Typography>
          <Typography gutterBottom variant="h2" component="h2" className={classes.cardAmount}>
            {renderAmount(fiatTotal)}
          </Typography>

          <Typography gutterBottom variant="h2" component="h2"
                      className={clsx(classes.cardAmount, classes.cardAmountSmall)}>
            <span>{currency && cryptoTotal || null}</span>
            <span>{' '}</span>
            <span className={classes.cardAmountLight}>{currency}</span>
          </Typography>

          <IconButton color="secondary"
                      className={classes.cardAction}
                      onClick={() => changeScreen(SCREENS.PAYMENTS, DIALOG_ACTIONS.ADD_PAYMENT)}>
            <AddIcon/>
          </IconButton>
        </CardContent>
      </Card>

      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h6" component="h3" className={classes.cardTitle}>
            Balance
          </Typography>
          <Typography gutterBottom variant="h2" component="h2" className={classes.cardAmount}>
            {renderAmount(fiatBalance)}
          </Typography>

          <Typography gutterBottom variant="h2" component="h2"
                      className={clsx(classes.cardAmount, classes.cardAmountSmall)}>
            <span>{currency && cryptoBalance || null}</span>
            <span>{' '}</span>
            <span className={classes.cardAmountLight}>{currency}</span>
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};