import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Button,
  CircularProgress,
  Input,
  InputAdornment,
  FormGroup,
  FormLabel,
  MenuItem,
  TextField, Grid,
} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import {Search as SearchIcon} from '@material-ui/icons';
import clsx from 'clsx';
import _ from 'lodash';

import Dialog, {useStyles as dialogStyles} from '../containers/Dialog';

import AppContext from '../../AppContext';

import {ACTIONS, INTEGRATIONS, SPREADSHEET_COLUMNS, SPREADSHEET_COLUMNS_DISPLAY} from '../../helpers/contants';
import {connectToGoogle, getSpreadsheets, getSpreadsheet, getSpreadsheetData} from '../../helpers/google';
import {sendContentRequest, syncContactsWithGoogleSheets} from '../../helpers/routines';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {searchItems} from "../../helpers/utils";

const useStyles = makeStyles((theme) => ({
  alert: {
    margin: theme.spacing(0, 0, 2),
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(1.5),
  },
  formGroup: {
    marginBottom: theme.spacing(2),
  },
  searchOption: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#FFF',
    zIndex: 1,
  },
  searchInput: {
    width: '100%',
  }
}));

export default ({initialData, nextDialog}) => {
  const classes = useStyles();
  const dialogClasses = dialogStyles();
  const {openDialog, closeDialog, getContacts, getPayments, addIntegration} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(false);

  const [spreadsheets, setSpreadsheets] = useState([]);
  const [spreadsheet, setSpreadsheet] = useState([]);
  const [search, setSearch] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [spreadsheetData, setSpreadsheetData] = useState([]);
  const [sheets, setSheets] = useState([]);

  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState(null);
  const [formError, setFormError] = useState(null);
  const [columnMap, setColumnMap] = useState({});
  const [columnMapErrors, setColumnMapErrors] = useState(null);

  useEffect(() => {
    setLoading(true);
    setFormError(null);
    connectToGoogle(true).then(token => {
      if (token) {
        setToken(token);
        getSpreadsheets(token).then(res => {
          setLoading(false);
          if (res && Array.isArray(res)) {
            setSpreadsheets(res);

            sendContentRequest(ACTIONS.GET_ACTIVE_GOOGLE_SHEET_DATA).then(contentRes => {
              if(contentRes.id) {
                updateData('spreadsheet', contentRes.id);
              }
            }).catch(() => {});
          }
        }).catch(() => {
          setLoading(false);
          setFormError(ERROR_MESSAGES.GOOGLE_SHEETS_CONNECT_FAILED);
        });
      } else {
        setLoading(false);
        setFormError(ERROR_MESSAGES.GOOGLE_SHEETS_CONNECT_FAILED);
      }
    }).catch(() => {
      setLoading(false);
      setFormError(ERROR_MESSAGES.GOOGLE_SHEETS_CONNECT_FAILED);
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      let newData;
      if (initialData) {
        newData = {...(initialData || {})};
      } else {
        newData = {...(initialData || {})};
      }
      if (newData) {
        setData(newData);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (token && data.spreadsheet) {
      setLoading(true);

      const spreadsheetDetails = (spreadsheets || []).find(i => i.id === data.spreadsheet) || null;
      setData({...(data || {}), sheet: '', spreadsheetName: spreadsheetDetails && spreadsheetDetails.name || ''});
      getSpreadsheet(token, data.spreadsheet).then(res => {
        setLoading(false);
        if (res) {
          setSpreadsheet(res);
          if (res.sheets && Array.isArray(res.sheets)) {
            setSheets(res.sheets);
            const sheet = res.sheets[0];
            let sheetId = sheet && sheet.id;
            sendContentRequest(ACTIONS.GET_ACTIVE_GOOGLE_SHEET_DATA).then(contentRes => {
              if(contentRes.id === data.spreadsheet && contentRes.sheet && contentRes.sheet.title) {
                const selectedSheet = (res.sheets || []).find(i => i.title === contentRes.sheet.title);
                if(selectedSheet && selectedSheet.id) {
                  sheetId = selectedSheet.id;
                }
              }
              updateData('sheet', sheetId);
            }).catch(() => {
              updateData('sheet', sheetId);
            });
          }
        }
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [data.spreadsheet]);

  useEffect(() => {
    if (token && data.spreadsheet && (data.sheet || typeof data.sheet === 'number')) {
      const sheet = sheets.find(i => i.id === data.sheet) || null;
      setLoading(true);
      getSpreadsheetData(token, data.spreadsheet, sheet && sheet.title || '').then(res => {
        setLoading(false);
        if (res && Array.isArray(res)) {
          setSpreadsheetData(res);

          const columns = res[0] || [];
          if(columns && columns.length) {
            let defaultColumnMap = {};
            for (const [key, test] of [
              [SPREADSHEET_COLUMNS.NAME, i => /name/i.test(i)],
              [SPREADSHEET_COLUMNS.EMAIL, i => /e?-?mail/i.test(i)],
              [SPREADSHEET_COLUMNS.ADDRESS, i => /address|wallet/i.test(i) && !/e?-?mail/i.test(i)]
            ]) {
              for (const column of columns) {
                const takenColumns = Object.keys(defaultColumnMap).map(i => defaultColumnMap[i]);
                if(test && typeof test === 'function' && test(column) && !takenColumns.includes(column)) {
                  defaultColumnMap[key] = column;
                }
              }
            }
            if(Object.keys(defaultColumnMap).length) {
              setColumnMap(defaultColumnMap);
            }
          }
        }
      }).catch(e => {
        setLoading(false);
      });
    }
  }, [data.sheet]);

  const updateData = (key, value) => {
    setData(data => ({...(data || {}), [key]: value || typeof value === 'number' ? value : ''}));
    if (errors && errors[key]) {
      let newErrors = {...(errors || {})};
      delete newErrors[key];
      setErrors(newErrors);
    }
  };

  const updateColumnMap = (key, value) => {
    setColumnMap({...(columnMap || {}), [key]: value || typeof value === 'number' ? value : ''});
    if (errors && errors[key]) {
      let newColumnMapErrors = {...(errors || {})};
      delete newColumnMapErrors[key];
      setColumnMapErrors(newColumnMapErrors);
    }
  };

  const parseSpreadsheetOptions = () => {
    return (spreadsheets || []).map(item => {
      if(item) {
        const value = item.id,
          label = item.name || item.id || '';
        return {
          value,
          label,
        };
      }
      return null;
    }).filter(i => i);
  };

  const saveIntegration = e => {
    e.preventDefault();

    const sheetDetails = sheets.find(i => i.id === data.sheet) || null;
    const integration = {
      id: data.spreadsheet,
      ..._.omit(spreadsheet, ['sheets']),
      sheet: {
        id: data.sheet,
        ...(sheetDetails || {})
      },
      columnMap,
      columns: spreadsheetData && spreadsheetData[0] || [],
    };

    setSaving(true);
    addIntegration(INTEGRATIONS.GOOGLE_SHEETS, integration).then(res => {
      setSaving(false);
      syncContactsWithGoogleSheets().then(res => {
        // Refresh contacts and payments
        getContacts().catch(() => {});
        getPayments().catch(() => {});
      }).catch(() => {});
      if (nextDialog) {
        openDialog({...nextDialog, integration});
      } else {
        closeDialog();
      }
    }).catch(e => {
      setSaving(false);
      setFormError(e && e.message || ERROR_MESSAGES.UNKNOWN);
    });
  };

  const hasSetSpreadsheet = data && data.spreadsheet,
    hasSetSheet = data && (data.sheet || typeof data.sheet === 'number'),
    spreadsheetOptionsResults = searchItems(
      search, parseSpreadsheetOptions(spreadsheets), ['value', 'label'], ['label']
    );

  return (
    <Dialog title="Connect Google Sheet"
            ariaLabel="connect google sheet">
      <form onSubmit={saveIntegration}>
        {formError && (
          <Alert severity="error" className={classes.alert}>{formError || ''}</Alert>
        ) || null}

        {loading && !(spreadsheets || []).length && (
          <div className={classes.loading}>
            <CircularProgress size={30}/>
          </div>
        ) || (
          <FormGroup className={classes.formGroup}>
            <TextField label="Spreadsheet"
                       type="text"
                       select
                       value={data && data.spreadsheet || ''}
                       placeholder="Spreadsheet"
                       required={true}
                       error={errors && errors.spreadsheet || ''}
                       helperText={errors && errors.spreadsheet || ''}
                       onChange={e => {
                         const value = e.target.value;
                         updateData('spreadsheet', value);
                       }}
                       SelectProps={{
                         open: showOptions,
                         onOpen: (e) => {
                           setShowOptions(true);
                         },
                         onClose: (e) => {
                           const elem = e.target;
                           if(!elem || elem.getAttribute('type') !== 'search') {
                             setShowOptions(false);
                             setSearch('');
                           }
                         },
                         MenuProps: {
                           autoFocus: false,
                         }
                       }}>
              <MenuItem key="search">
                <Input type="search"
                       placeholder="Search"
                       autoFocus={true}
                       startAdornment={(
                         <InputAdornment position="start">
                           <SearchIcon/>
                         </InputAdornment>
                       )}
                       onKeyDown={e => {
                         e.stopPropagation();
                       }}
                       onChange={e => {
                         setSearch(e.target.value || '');
                       }}
                       className={classes.searchInput}/>
              </MenuItem>
              {(spreadsheetOptionsResults || []).map(item => {
                if (item) {
                  const value = item.value,
                    label = item.label || item.value || '';

                  return (
                    <MenuItem key={value}
                              value={value}>
                      {label}
                    </MenuItem>
                  );
                }
                return null;
              })}
            </TextField>
          </FormGroup>
        )}

        {data && hasSetSpreadsheet && (
          <>
            {loading && !(sheets || []).length && (
              <div className={classes.loading}>
                <CircularProgress size={30}/>
              </div>
            ) || (
              <FormGroup className={classes.formGroup}>
                {formError && (
                  <Alert severity="error" className={classes.alert}>{formError || ''}</Alert>
                ) || null}

                <TextField label="Sheet"
                           type="text"
                           select
                           value={(data && (data.sheet || typeof data.sheet === 'number')) ? data.sheet : ''}
                           placeholder="Sheet"
                           required={true}
                           error={errors && errors.sheet || ''}
                           helperText={errors && errors.sheet || ''}
                           onChange={e => updateData('sheet', e.target.value)}>
                  {(sheets || []).map(item => {
                    if (item) {
                      const value = item.id,
                        label = item.title || item.id || '';
                      return (
                        <MenuItem key={value}
                                  value={value}>
                          {label}
                        </MenuItem>
                      );
                    }
                    return null;
                  })}
                </TextField>
              </FormGroup>
            )}

            {hasSetSheet && (
              <>
                <FormLabel required={true}>
                  Column Map
                </FormLabel>

                {loading && !(spreadsheetData || []).length && (
                  <div className={classes.loading}>
                    <CircularProgress size={30}/>
                  </div>
                ) || (
                  <>
                    {[SPREADSHEET_COLUMNS.NAME, SPREADSHEET_COLUMNS.EMAIL, SPREADSHEET_COLUMNS.ADDRESS].map(value => {
                      const label = SPREADSHEET_COLUMNS_DISPLAY[value] || value || '';
                      return (
                        <FormGroup className={classes.formGroup}>
                          <TextField label={label}
                                     type="text"
                                     select
                                     value={columnMap && columnMap[value] || ''}
                                     placeholder={label}
                                     required={true}
                                     error={columnMapErrors && columnMapErrors[value] || ''}
                                     helperText={columnMapErrors && columnMapErrors[value] || ''}
                                     onChange={e => updateColumnMap(value, e.target.value)}
                          >
                            {(spreadsheetData && spreadsheetData[0] || []).map(columnName => {
                              const selectedColumnNames = Object.keys(columnMap).map(key => columnMap[key]);
                              if (!selectedColumnNames.includes(columnName) || columnMap[value] === columnName) {
                                return (
                                  <MenuItem key={columnName}
                                            value={columnName}>
                                    {columnName}
                                  </MenuItem>
                                );
                              }
                              return null;
                            })}
                          </TextField>
                        </FormGroup>
                      );
                    })}
                  </>
                )}
              </>
            ) || null}
          </>
        ) || null}

        <div className={clsx(dialogClasses.dialogActions, dialogClasses.dialogActionsGrid)}>
          <Grid container
                direction="row"
                justify="space-between"
                wrap="nowrap">
            <Button type="button"
                    color="primary"
                    variant="outlined"
                    onClick={() => {
                      if (nextDialog) {
                        openDialog(nextDialog);
                      } else {
                        closeDialog();
                      }
                    }}>
              Cancel
            </Button>
            <Button type="submit"
                    color="primary"
                    variant="contained"
                    disabled={saving || !hasSetSpreadsheet || !hasSetSheet || !columnMap || !columnMap[SPREADSHEET_COLUMNS.NAME] || !columnMap[SPREADSHEET_COLUMNS.EMAIL] || !columnMap[SPREADSHEET_COLUMNS.ADDRESS]}>
              Save
            </Button>
          </Grid>
        </div>
      </form>
    </Dialog>
  );
};