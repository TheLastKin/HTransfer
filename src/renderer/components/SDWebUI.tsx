import React, { useEffect } from 'react';

type SDWebUIProps = {
  visible: boolean,
  setWebUIOpened: (opened: boolean) => void,
}

let webUIURL = "http://127.0.0.1:7860/"

const SDWebUI = ({ visible, setWebUIOpened }: SDWebUIProps) => {

  useEffect(() => {
    checkIfAvailable()
  }, [])

  const checkIfAvailable = () => {
    fetch(webUIURL)
    .then(res => {
      if(res.status === 200){
        const webUI = document.querySelector(".sd_web_ui") as HTMLIFrameElement;
        webUI.src = webUI.src
        setWebUIOpened(true);
      }
    }).catch(e => setTimeout(checkIfAvailable, 2500))
  }

  return (
    <iframe style={{ zIndex: visible ? "4" : "-1", opacity: visible ? "1" : "0" }} className='sd_web_ui' src={webUIURL} ></iframe>
  );
};

export default SDWebUI;
