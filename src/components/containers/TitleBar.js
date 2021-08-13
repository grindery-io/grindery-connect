import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Chip} from '@material-ui/core';
import {Close as CloseIcon} from '@material-ui/icons';

import AppContext from '../../AppContext';

import {getScreenDetails, truncateAddress} from '../../helpers/utils';
import {SCREENS} from '../../helpers/contants';

import logo from '../../images/grindery-logo-white.svg';
import checkIcon from '../../images/check.svg';
import coinIcon from '../../images/coin.svg';
import settingsIcon from '../../images/settings-white.svg';

const useStyles = makeStyles((theme) => ({
  container: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    padding: theme.spacing(2.5),
  },
  firstRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(1.4),
  },
  logo: {
    height: 21,
  },
  close: {
    color: theme.palette.primary.contrastText,
    cursor: 'pointer',
  },
  settings: {
    minWidth: 24,
    height: 24,
    cursor: 'pointer',
  },
  settingsIcon: {
    height: 24,
    cursor: 'pointer',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 1.5,
  },
  icon: {
    display: 'inline-block',
    height: 9,
    marginRight: theme.spacing(0.5),
  },
  address: {
    flexDirection: 'row-reverse',
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.6,
    color: theme.palette.primary.contrastText,
    border: '1px solid #546076',
    paddingRight: theme.spacing(2),
  },
  coin: {
    display: 'inline-block',
    height: 18,
    marginLeft: theme.spacing(1.25),
    borderRadius: '100%',
  },
}));

export default () => {
  const classes = useStyles();
  const {accessToken, screen, addresses, networks, logOut, getNetworkById, changeScreen} = useContext(AppContext);

  const close = () => {
    logOut();
    window.close();
  };

  const address = addresses && addresses[0] || '',
    networkId = networks && networks[0] || null,
    network = getNetworkById(networkId);

  let firstRow = (
    <div className={classes.title}>Grindery Payroll</div>
  ), secondRow = null;

  switch (screen) {
    default: {
      if(accessToken) {
        firstRow = (
          <>
            <img className={classes.logo} src={logo} height={21}/>
            {network && (network.name || network.chain) && (
              <div>{network.name || network.chain}</div>
            ) || null}
          </>
        );

        const screenTitle = getScreenDetails(screen, 'title') || 'Grindery';
        secondRow = (
          <>
            <div className={classes.title}>{screenTitle}</div>
            {address && (
              <>
                {address && (
                  <Chip label={truncateAddress(address)}
                        variant="outlined"
                        className={classes.address}
                        icon={(
                          <img className={classes.coin} src={coinIcon} height={18}/>
                        )}/>
                ) || null}
                <div className={classes.subtitle}>
                  <img src={checkIcon} height={9}/> MetaMask
                </div>
              </>
            ) || null}
          </>
        );
      }
    }
  }

  return (
    <div className={classes.container}>
      <div className={classes.firstRow}>
        {firstRow}


        {accessToken && (
          <div className={classes.settings}
               onClick={() => changeScreen(SCREENS.SETTINGS)}>
            <img src={settingsIcon}
                 className={classes.settingsIcon}
                 height={24}/>
          </div>
        ) || (
          <CloseIcon className={classes.close}
                     onClick={close}/>
        )}
      </div>
      {secondRow && (
        <div className={classes.secondRow}>
          {secondRow}
        </div>
      ) || null}
    </div>
  );
};