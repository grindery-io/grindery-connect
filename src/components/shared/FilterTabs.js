import React, {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  AppBar,
  Tabs,
  Tab
} from '@material-ui/core';
import clsx from 'clsx';

const useStyles = makeStyles((theme) => ({
  container: {
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.common.white,
    marginBottom: theme.spacing(1),
  },
  tab: {
    minWidth: 0,
    textTransform: 'none',
    whiteSpace: 'nowrap',
  },
  selectedTab: {
    color: `${theme.palette.secondary.main} !important`,
  },
}));

export default ({items, onChange, className, style}) => {
  const classes = useStyles();
  const [currentIdx, setFilter] = useState(0);

  if(!items || !Array.isArray(items)) {
    return null;
  }

  useEffect(() => {
    if(onChange) {
      onChange(currentIdx > -1?items[currentIdx]:null);
    }
  }, [currentIdx]);

  return (
    <AppBar position="static"
            color="default"
            className={clsx(classes.container, className || '')}
            style={style}>
      <Tabs value={currentIdx}
            onChange={(event, idx) => {
              setFilter(idx);
            }}
            variant="fullWidth"
            indicatorColor="secondary"
            textColor="primary"
            aria-label="tabs">
        {(items || []).map((filter, idx) => {
          return (
            <Tab className={clsx(classes.tab, {[classes.selectedTab]: currentIdx === idx})}
                 aria-label={filter}
                 label={filter}
            />
          );
        })}
      </Tabs>
    </AppBar>
  );
};