import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Paper, Tabs, Tab} from '@material-ui/core';
import {Receipt as ReceiptIcon} from '@material-ui/icons';
import clsx from 'clsx';

import AppContext from '../../AppContext';

import {SCREENS} from '../../helpers/contants';
import {getScreenDetails} from '../../helpers/utils';

const useStyles = makeStyles((theme) => ({
  tab: {
    minWidth: 0,
  },
  icon: {
    height: 24,
  },
  iconSmaller: {
    height: 22,
  }
}));

export default () => {
  const classes = useStyles();
  const {accessToken, screen, changeScreen} = useContext(AppContext);

  if(!accessToken) {
    return null;
  }
  const tabScreens = [SCREENS.HOME, SCREENS.CONTACTS, SCREENS.PAYMENTS, SCREENS.TRANSACTIONS];
  const currentIdx = screen === SCREENS.SETTINGS?-1:Math.max(0, tabScreens.findIndex(i => i === screen) || 0);
  return (
    <Paper square>
      <Tabs
        value={currentIdx}
        onChange={(event, idx) => {
          const newScreen = tabScreens[idx];
          if(newScreen) {
            changeScreen(newScreen);
          }
        }}
        variant="fullWidth"
        indicatorColor="primary"
        textColor="primary"
        aria-label="tabs"
      >
        {tabScreens.map((screen, idx) => {
          const screenIcons = getScreenDetails(screen, 'icon');
          const icon = screenIcons && screenIcons.main,
            iconLight = screenIcons && (screenIcons.light || screenIcons.main);

          return (
            <Tab className={classes.tab}
                 aria-label={screen}
                 icon={(
                   <img src={currentIdx !== idx?iconLight:icon}
                        className={clsx(classes.icon, {
                          [classes.iconSmaller]: screen === SCREENS.TRANSACTIONS,
                        })}/>
                 )}
            />
          );
        })}
      </Tabs>
    </Paper>
  );
};