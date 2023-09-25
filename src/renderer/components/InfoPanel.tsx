import React, { useEffect, useState } from 'react';
import '../componentCss/info_panel.css'
import { ImageInfo } from 'renderer/constant/types';

type InfoPanelProps = {
  info: ImageInfo | null,
  onPanelClosed: () => void
}

const commonTagColor = 'rgb(85, 118, 190)';
const charTagColor = 'rgb(181, 184, 6)';
const specialTagColor = 'rgb(221, 34, 50)';

const InfoPanel = ({ info, onPanelClosed }: InfoPanelProps) => {
  const [SDprops, setSDprops] = useState({ prompt: "", negativePrompt: "", genProps: "" })
  console.log(info)

  useEffect(() => {
    if(info?.path){
      fetchSDprops();
    }
  }, [info])

  const fetchSDprops = async () => {
    let view = (document.querySelector(`.image_card[data-path="${info?.path.replace(/\\/g, "\\\\")}"]`) as HTMLElement);
    if(view){
      let SDdata: string | undefined = view.dataset.SDdata
      if(SDdata){
        let split = SDdata.split("\n")
        setSDprops({ prompt: split[0], negativePrompt: split[1], genProps: split[2] })
      }else{
        setSDprops({ prompt: "", negativePrompt: "", genProps: "" })
      }
    }else{
      setSDprops({ prompt: "", negativePrompt: "", genProps: "" })
    }
  }

  return (
    <div className='info_panel'>
      <div className="close_info_panel" onClick={onPanelClosed}>
        X
      </div>
      <div className="info_name">{info?.name}</div>
      <div className="info_dimensions">Dimensions: {info?.width}x{info?.height} (in pixel)</div>
      <div className="info_path">Path: {info?.path}</div>
      <div className="info_created_date">Created: {new Date(info?.createdDate || Date.now()).toLocaleString()}</div>
      <div className="info_last_modified">Last Modified: {new Date((info?.lastModifiedDate || info?.createdDate) || Date.now()).toLocaleString()}</div>
      <div className="info_chapters">
        <div style={{ marginRight: "3px" }} className="heading">Chapters:</div>
        {
          info?.chapters?.map((chapter, index) => (
            <span className="info_chapter_name">{chapter}{index < info?.chapters!.length-1 ? ", " : ""}</span>
          ))
        }
      </div>
      <div className="info_tags">
        <div className='heading'>Tag:</div>
        <div className="info_tag_list">
          {
            info?.tags?.map(tag => (
              <div style={{ backgroundColor: tag.type === "common" ? commonTagColor : (tag.type === "char" ? charTagColor : specialTagColor)}} className="info_tag">{tag.name}</div>
            ))
          }
        </div>
      </div>
      {
        SDprops.prompt ?
        <>
          <div className="info_sd">
        Stable Diffusion props:
          </div>
          <div className="info_prompt">
            {SDprops.prompt}
          </div>
          <div className="info_neg_prompt">
            {SDprops.negativePrompt}
          </div>
          <div className="info_gen_props">
            {SDprops.genProps}
          </div>
        </> : <></>
      }
    </div>
  );
};

export default InfoPanel;
