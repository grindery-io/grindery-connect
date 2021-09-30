import React, {useState} from 'react';
import {Tooltip} from '@material-ui/core';
import {CopyToClipboard} from 'react-copy-to-clipboard';


export default ({text, children}) => {
  const [copied, setCopied] = useState(false);

  const onCopied = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <CopyToClipboard text={text}
                     onCopy={onCopied}>
      <Tooltip title={copied?'Copied!':'Click to copy'}
               placement="top">
        {children}
      </Tooltip>
    </CopyToClipboard>
  );
};