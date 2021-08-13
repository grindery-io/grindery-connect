import React, {useContext} from 'react';

import Auth from '../screens/Auth';
import Home from '../screens/Home';
import Contacts from '../screens/Contacts';
import Payments from '../screens/Payments';
import Transactions from '../screens/Transactions';
import Settings from '../screens/Settings';

import AppContext from '../../AppContext';

import {SCREENS} from '../../helpers/contants';

export default () => {
  const {accessToken, screen} = useContext(AppContext);

  if(!accessToken) {
    return (
      <Auth/>
    );
  }
  switch (screen) {
    case SCREENS.CONTACTS: {
      return (
        <Contacts />
      );
    }
    case SCREENS.PAYMENTS: {
      return (
        <Payments />
      );
    }
    case SCREENS.TRANSACTIONS: {
      return (
        <Transactions />
      );
    }
    case SCREENS.SETTINGS: {
      return (
        <Settings />
      );
    }
    default: {
      return (
        <Home/>
      );
    }
  }
};