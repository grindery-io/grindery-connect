import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import clsx from 'clsx';

export const useStyles = makeStyles((theme) => ({
  dialog: {
    width: 'calc(375px - 40px)',
    inset: `${theme.spacing(15)}px auto auto ${theme.spacing(2.5)}px !important`,
  },
  dialogTall: {
    top: `${theme.spacing(11.25)}px !important`,
  },
  dialogTaller: {
    top: `${theme.spacing(5)}px !important`,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: 'normal',
    lineHeight: 1.6,
    textAlign: 'center',
    padding: theme.spacing(2.5, 2.5, 1.25),
  },
  dialogContainer: {
    color: '#363636',
    borderRadius: 10,
  },
  dialogContent: {
    padding: theme.spacing(1.25, 2.5, 1.25),
  },
  dialogActions: {
    margin: theme.spacing(1.25, 0, 2.5),
    '& button': {
      display: 'block',
      width: '100%',
    },
    '& button + button': {
      marginTop: theme.spacing(1.25),
    }
  },
  dialogActionsOverride: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginLeft: theme.spacing(2.5),
    marginRight: theme.spacing(2.5),
  },
}));

export default ({children, title, content, actions, className, onClose, ariaLabel, ...props}) => {
  const classes = useStyles();

  return (
    <Dialog {...props}
            open={true}
            onClose={onClose}
            fullScreen={true}
            disableBackdropClick={true}
            disableEscapeKeyDown={true}
            className={className || ''}
            classes={{
              root: classes.dialog,
              paper: classes.dialogContainer,
            }}
            aria-labelledby={ariaLabel || (typeof title === 'string' && title) || ''}>
      <DialogTitle className={classes.dialogTitle}>
        {title || ''}
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        {children || content}
      </DialogContent>

      {actions && (
        <DialogActions className={clsx(classes.dialogActions, classes.dialogActionsOverride)}>
          {actions}
        </DialogActions>
      ) || null}
    </Dialog>
  );
};