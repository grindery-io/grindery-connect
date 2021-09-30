import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Paper, Tabs, Tab, Tooltip} from '@material-ui/core';
import clsx from 'clsx';

import AppContext from '../../AppContext';

import {SCREENS} from '../../helpers/contants';
import {getScreenDetails} from '../../helpers/utils';

const useStyles = makeStyles((theme) => ({
  container: {
    background: '#FDFBFF',
    boxShadow: 'inset 0 -2px 20px rgba(0, 0, 0, 0.08)',
    height: '100%',
  },
  tab: {
    minWidth: 0,
  },
  icon: {
    height: 24,
  },
}));

export default () => {
  const classes = useStyles();
  const {accessToken, screen, changeScreen} = useContext(AppContext);

  const tabScreens = [
    SCREENS.HOME, SCREENS.CONTACTS,
    SCREENS.CONTRACTS, SCREENS.PAYMENTS,
    SCREENS.WALLET, SCREENS.FUND, SCREENS.WITHDRAW,
    SCREENS.TRANSACTIONS, SCREENS.SETTINGS
  ];
  const currentIdx = accessToken?Math.max(0, tabScreens.findIndex(i => i === screen) || 0):-1;
  return (
    <Paper square className={classes.container}>
      <Tabs orientation="vertical"
            value={currentIdx}
            onChange={(event, idx) => {
              const newScreen = tabScreens[idx];
              if(newScreen) {
                changeScreen(newScreen);
              }
            }}
            variant="scrollable"
            indicatorColor="primary"
            textColor="primary"
            aria-label="tabs"
            TabIndicatorProps={{
              style: {left: 0, right: 'auto'}
            }}
      >
        {tabScreens.map((screen, idx) => {
          const screenIcons = getScreenDetails(screen, 'icon');
          const title = getScreenDetails(screen, 'tooltip') || getScreenDetails(screen, 'title'),
            icon = screenIcons && screenIcons.main,
            iconLight = screenIcons && (screenIcons.light || screenIcons.main);

          return (
            <Tab className={classes.tab}
                 aria-label={screen}
                 icon={(
                   <Tooltip title={title}
                            placement="left">
                     <img src={currentIdx !== idx?iconLight:icon}
                          className={classes.icon}/>
                   </Tooltip>
                 )}
            />
          );
        })}
      </Tabs>
    </Paper>
  );
};