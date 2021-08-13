import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputBase
} from '@material-ui/core';
import {Search as SearchIcon, Add as AddIcon} from '@material-ui/icons';
import {Alert} from '@material-ui/lab';
import clsx from 'clsx';
import _ from 'lodash';

import AppContext from '../../AppContext';

import {DIALOG_ACTIONS, SCREENS} from '../../helpers/contants';
import {getContactPayments, getInitials, getPaymentsTotal, truncateAddress} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {cardStyles, COLORS} from '../../helpers/style';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: COLORS.contentBg,
    padding: theme.spacing(1.25, 2.5),
  },
  content: {
    padding: theme.spacing(0, 2.5, 2.5),
    '& > *': {
      width: '100%',
    }
  },
  search: {
    position: 'relative',
    borderRadius: 10,
    backgroundColor: theme.palette.common.white,
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
  },
  searchIcon: {
    color: '#9D9D9D',
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    width: '100%',
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  emptyActions: {
    textAlign: 'center',
    margin: theme.spacing(3, 0),
    '& > *': {
      marginBottom: theme.spacing(2),
    }
  }
}));

export default () => {
  const classes = useStyles();
  const cardClasses = cardStyles();
  const {currency, contacts, payments, changeScreen, openDialog, convertToCrypto, getContacts} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Load contacts
    setLoading(true);
    setError(null);

    getContacts().then(contacts => {
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      setError(ERROR_MESSAGES.READ_CONTACTS_FAILED);
    });
  }, []);

  const filterContacts = () => {
    let items = (contacts || []).map(item => {
      if (item) {
        const name = item.name || '',
          email = item.email || '';
        let rank = 1;

        if (search) {
          let searchSegments = _.uniq([search, ...(search || '').split(/\s+/)]);
          const regex = new RegExp(`${searchSegments.map(i => i && `(${i})` || null).filter(i => i).join('|')}`, 'i');
          if (!regex.test(name) && !regex.test(email)) {
            return null;
          }
          const firstSearch = (search || '').charAt(0).toLowerCase(),
            firstName = (name || '').charAt(0).toLowerCase(),
            firstEmail = (email || '').charAt(0).toLowerCase();

          if (firstSearch === firstName || firstSearch === firstEmail) {
            rank = 2;
          }
        }

        return {
          ...(item || {}),
          rank,
        };
      }
      return null;
    }).filter(i => i);
    if (search) {
      items = _.orderBy(items, ['rank', 'name', 'email'], ['desc', 'asc', 'email']);
    }
    return items;
  };

  const onAddContact = e => {
    e.preventDefault();
    openDialog(DIALOG_ACTIONS.ADD_CONTACT);
  };

  const goToSettings = e => {
    e.preventDefault();
    changeScreen(SCREENS.SETTINGS);
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <div className={classes.search}>
          <div className={classes.searchIcon}>
            <SearchIcon/>
          </div>
          <InputBase type="search"
                     placeholder="Search"
                     value={search}
                     onChange={e => setSearch(e.target.value || '')}
                     classes={{
                       root: classes.inputRoot,
                       input: classes.inputInput,
                     }}
                     inputProps={{'aria-label': 'search'}}
          />
        </div>

        <IconButton color="secondary"
                    onClick={onAddContact}>
          <AddIcon/>
        </IconButton>
      </div>

      <div className={classes.content}>
        {loading && (
          <div className={classes.loading}>
            <CircularProgress size={30}/>
          </div>
        ) || (
          <div>
            {contacts && contacts.length && (
              filterContacts(contacts).map(contact => {
                const fiatTotal = getPaymentsTotal(getContactPayments(contact, payments)),
                  cryptoTotal = convertToCrypto(fiatTotal);
                return (
                  <Card className={cardClasses.container}>
                    <CardContent className={cardClasses.content}>
                      <Avatar className={cardClasses.avatar}>{getInitials(contact.name)}</Avatar>
                      <div
                        className={clsx(cardClasses.detailsContainer, cardClasses.detailsGrid, cardClasses.detailsGridTwoColumn)}>
                        <div>
                          <div className={cardClasses.header}>
                            {contact.name}
                          </div>
                          {contact.email && (
                            <div className={cardClasses.subheader}>
                              {contact.email}
                            </div>
                          ) || null}
                          <div className={cardClasses.subheader}>
                            {truncateAddress(contact.address)}
                          </div>
                        </div>
                        <div>
                          <div className={cardClasses.subheader}>
                            Total Due
                          </div>
                          <div className={cardClasses.header}>
                            ${fiatTotal}
                          </div>
                          {currency && (
                            <div className={cardClasses.subheader}>
                              {cryptoTotal}{' '}{currency}
                            </div>
                          ) || null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) || (
              <>
                <Alert severity={error && 'error' || 'info'}>
                  {error || (
                    <>
                      <div>{ERROR_MESSAGES.NO_CONTACTS}</div>
                    </>
                  )}
                </Alert>

                <div className={classes.emptyActions}>
                  <Button type="button"
                          color="secondary"
                          variant="outlined"
                          onClick={onAddContact}>
                    Add a Contact
                  </Button>

                  <Button type="button"
                          color="secondary"
                          variant="outlined"
                          onClick={goToSettings}>
                    Configure an Integration
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};