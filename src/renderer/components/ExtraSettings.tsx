import React, { useContext, useEffect, useState, useRef } from 'react';
import '../componentCss/extra_settings.css'
import { MdSettings } from 'react-icons/md'
import { BsCheck } from 'react-icons/bs'
import { colorGradients } from 'renderer/constant/types';
import { AppContext } from 'renderer/constant/context';

const ExtraSettings = () => {
  const [showMenu, setShowMenu] = useState(false)
  const { appSettings, saveAppSettings } = useContext(AppContext)
  const showMenuRef = useRef<boolean>()

  showMenuRef.current = showMenu

  useEffect(() => {
    const container = document.querySelector(".extra_settings") as HTMLElement;
    if(container){
      const icon = container.querySelector(".settings_icon") as HTMLElement;
      const menu = container.querySelector(".settings_menu") as HTMLElement;
      container.onmouseenter = () => {
        container.style.left = "-20px"
      }
      container.onmouseleave = () => {
        if(!showMenuRef.current){
          container.style.left = "-30px"
        }
      }
      icon.onclick = () => {
        if(showMenuRef.current){
          menu.style.left = "calc(100% + 10px)"
          menu.style.opacity = "0"
          setTimeout(() => {
            menu.style.display = "none"
          }, 150)
          icon.style.animationPlayState = "paused"
        }else{
          menu.style.display = "block"
          menu.style.left = "calc(100% + 15px)"
          menu.style.opacity = "1"
          icon.style.animationPlayState = "running"
        }
        setShowMenu(!showMenuRef.current)
      }
    }
    (document.querySelector(".img_container") as HTMLElement).addEventListener("click", blurMenu)
  }, [])

  const blurMenu = () => {
    const container = document.querySelector(".extra_settings") as HTMLElement;
    const icon = container.querySelector(".settings_icon") as HTMLElement;
    const menu = container.querySelector(".settings_menu") as HTMLElement;
    if(showMenuRef.current){
      container.style.left = "-30px"
      menu.style.left = "calc(100% + 10px)"
      menu.style.opacity = "0"
      setTimeout(() => {
        menu.style.display = "none"
      }, 150)
      icon.style.animationPlayState = "paused"
    }
    setShowMenu(false)
  }

  const toggleShowInRow = () => saveAppSettings({ ...appSettings, showInRow: !appSettings.showInRow })

  const setAppBackgroundGradient = (gradient: number) => () => saveAppSettings({ ...appSettings, colorScheme: gradient })

  return (
    <div className='extra_settings'>
      <div className='settings_icon'>
        <MdSettings/>
      </div>
      <div className="settings_menu">
        <div className="show_in_row" onClick={toggleShowInRow}>
          <div style={{ backgroundColor: appSettings.showInRow ? "rgb(103, 174, 255)" : "rgba(32, 32, 32, 0.25)" }} className="check_box_row">
            { appSettings.showInRow && <BsCheck/>}
          </div>
          <span>Show in row</span>
        </div>
        <div className="horizontal_divider_2"></div>
        <div className="color_schemes">
          {
            colorGradients.map((gradient, index) => (
              <div style={{
                background: `linear-gradient(200deg, ${gradient.top} -30%, ${gradient.middle} 48%, ${gradient.bottom} 130%)`,
              }}
              className={`scheme ${appSettings.colorScheme === index ? "active_scheme" : ""}`}
              onClick={setAppBackgroundGradient(index)}></div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default ExtraSettings;
