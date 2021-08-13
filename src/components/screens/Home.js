import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Button, Card, CardContent, Typography} from '@material-ui/core';
import clsx from 'clsx';

import AppContext from '../../AppContext';

import {DIALOG_ACTIONS, SCREENS, TASKS} from '../../helpers/contants';
import {filterPendingPayments, getPaymentsTotal} from '../../helpers/utils';
import {makeBackgroundRequest} from '../../helpers/routines';

import contactsLighter from '../../images/contacts-lighter.svg';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  card: {
    textAlign: 'center',
    marginBottom: theme.spacing(1.25),
    borderRadius: 10,
    '&:last-child': {
      marginBottom: 0,
    },
    '& button': {
      fontSize: 12,
      lineHeight: 1.5,
      borderRadius: 100,
    },
    '& button.disabled': {
      cursor: 'not-allowed',
    }
  },
  cardContent: {
    padding: theme.spacing(1.5),
    '&:last-child': {
      padding: theme.spacing(1.5),
    }
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 1.5,
    marginBottom: theme.spacing(1.25),
  },
  cardAmount: {
    fontSize: 25,
    fontWeight: 300,
    lineHeight: 1,
    marginBottom: theme.spacing(1.25),
  },
  cardAmountSmall: {
    fontSize: 15,
    fontWeight: 300,
    lineHeight: 1,
    marginBottom: theme.spacing(1.25),
  },
  cardAmountLight: {
    opacity: 0.4,
  },
  cardAmountIcon: {
    display: 'inline-block',
    height: 18,
    fill: '#DADADA',
    marginRight: theme.spacing(1),
    verticalAlign: 'baseline',
  }
}));

export default () => {
  const classes = useStyles();
  const {currency, addresses, contacts, payments, transactions, changeScreen, convertToCrypto, convertPayableToDisplayValue, convertToFiat, getTransactions} = useContext(AppContext);

  const [balance, setBalance] = useState(0);

  const address = addresses && addresses[0] || '',
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
  }, [address]);

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

  const pendingPayments = filterPendingPayments(payments, transactions),
    fiatTotal = getPaymentsTotal(pendingPayments),
    cryptoTotal = convertToCrypto(fiatTotal);

  return (
    <div className={classes.container}>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h6" component="h3" className={classes.cardTitle}>
            Amount of contacts:
          </Typography>
          <Typography gutterBottom variant="h2" component="h2" className={classes.cardAmount}>
            <img src={contactsLighter} className={classes.cardAmountIcon} height={18}/>
            <span>{contacts && contacts.length || 0}</span>
          </Typography>

          <Button type="button"
                  color="secondary"
                  variant="outlined"
                  onClick={() => changeScreen(SCREENS.CONTACTS, DIALOG_ACTIONS.ADD_CONTACT)}>
            Add Contact
          </Button>
        </CardContent>
      </Card>

      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h6" component="h3" className={classes.cardTitle}>
            Pending payments:
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

          <Button type="button"
                  color="secondary"
                  variant="outlined"
                  onClick={() => changeScreen(SCREENS.PAYMENTS)}>
            Make Payment
          </Button>
        </CardContent>
      </Card>

      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h6" component="h3" className={classes.cardTitle}>
            Balance:
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