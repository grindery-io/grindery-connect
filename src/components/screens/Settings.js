/*global chrome*/
import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Button, CircularProgress, Grid, Typography} from '@material-ui/core';
import {Alert} from '@material-ui/lab';

import AppContext from '../../AppContext';

import {DIALOG_ACTIONS, INTEGRATIONS} from '../../helpers/contants';
import {getIntegrationDetails} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';

const useStyles = makeStyles((theme) => ({
  container: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.6,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 1.6,
    textAlign: 'center',
    marginBottom: theme.spacing(5),
  },
  integration: {
    padding: theme.spacing(2.75),
    borderBottom: '1px solid #D3DEEC',
    '& > *:not(:last-child)': {
      marginBottom: theme.spacing(3.25),
    },
  },
  logo: {
    height: 35,
  },
  connected: {
    fontWeight: 'bold',
    color: '#2EC5CE',
  },
  disconnected: {
    fontWeight: 'bold',
    color: '#6D6F78',
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  about: {
    color: theme.palette.text.secondary,
    padding: theme.spacing(2.75),
  }
}));

let manifest = null;
try {
  manifest = chrome.runtime.getManifest();
} catch (e) {
  //
}

export default () => {
  const classes = useStyles();
  const {integrations, openDialog, getIntegrations, removeIntegration} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState({});

  useEffect(() => {
    // Load payments
    setLoading(true);
    setError(null);

    getIntegrations().then(integrations => {
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      setError(ERROR_MESSAGES.READ_INTEGRATIONS_FAILED);
    });
  }, []);

  const onConnect = name => {
    setConnecting({...connecting, [name]: true});
    switch (name) {
      case INTEGRATIONS.GOOGLE_SHEETS: {
        openDialog(DIALOG_ACTIONS.CONNECT_GOOGLE_SHEET);
        break;
      }
      default: {
        break;
      }
    }
  };

  const onDisconnect = name => {
    removeIntegration(name);
  };

  return (
    <div className={classes.container}>
      <Typography variant="h2" component="h2" className={classes.header}>Sync Contacts & Payrolls</Typography>

      {loading && (
        <div className={classes.loading}>
          <CircularProgress size={30}/>
        </div>
      ) || (
        error && (
          <Alert severity="error">{error || ERROR_MESSAGES.READ_INTEGRATIONS_FAILED}</Alert>
        ) || (
          [INTEGRATIONS.GOOGLE_SHEETS, INTEGRATIONS.GUSTO].map(name => {
            const isConnected = (integrations || {})[name];
            const integrationLogo = getIntegrationDetails(name, 'logo');
            const isDisabled = name === INTEGRATIONS.GUSTO;
            return (
              <div key={name} className={classes.integration}>
                <Grid container
                      direction="row"
                      justify="space-between"
                      alignItems="center">
                  <img src={integrationLogo} height={35}/>
                  <Button type="button"
                          color={isConnected?'primary':'secondary'}
                          variant="contained"
                          disabled={isDisabled}
                          onClick={() => isConnected?onDisconnect(name):onConnect(name)}>
                    {isDisabled?'Coming soon':(isConnected?'Disconnect':'Connect')}
                  </Button>
                </Grid>
                <Grid container
                      direction="row"
                      justify="space-between"
                      alignItems="center">
                  <div>
                    <span>Status: </span>
                    <span className={isConnected?classes.connected:classes.disconnected}>
                  {isDisabled?'Coming soon':(isConnected && 'Connected' || 'Disconnected')}
                </span>
                  </div>

                  <a href="#">
                    Learn more
                  </a>
                </Grid>
              </div>
            );
          })
        )
      )}

      {manifest && manifest.version && (
        <div className={classes.about}>
          {manifest.version && (
            <div><strong>Version:</strong> {manifest.version}</div>
          ) || null}
        </div>
      ) || null}
    </div>
  );
};