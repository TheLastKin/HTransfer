import React, { useContext, useEffect, useState } from 'react';
import '../componentCss/info_panel.css'
import { ImageInfo, Tag, getBackgroundColor } from 'renderer/constant/types';
import { AppContext } from 'renderer/constant/context';

type InfoPanelProps = {
  info: ImageInfo | null,
  onPanelClosed: () => void,
  onImageChanged: (info: ImageInfo) => void
}

const InfoPanel = ({ info, onPanelClosed, onImageChanged }: InfoPanelProps) => {
  const [SDprops, setSDprops] = useState({ prompt: "", negativePrompt: "", genProps: "" })
  const { imageFilter, setImageFilter, savedInfos, saveImageInfos, SDProps } = useContext(AppContext)

  useEffect(() => {
    if(info?.path){
      extractSDprops();
    }
  }, [info])

  const extractSDprops = async () => {
    let SDdata: string | undefined = SDProps.find(prop => prop.ofImage === info?.path)?.prompt
    if(SDdata){
      let split = SDdata.split("\n")
      setSDprops({ prompt: split[0], negativePrompt: split[1], genProps: split[2] })
    }else{
      setSDprops({ prompt: "", negativePrompt: "", genProps: "" })
    }
  }

  const selectTag = (tag: Tag) => () => {
    if(!imageFilter.selectedTags.some(t => t.name === tag.name && t.type === tag.type)){
      setImageFilter({ ...imageFilter, selectedTags: [...imageFilter.selectedTags, tag]})
    }
  }

  const deleteTag = (tag: Tag) => () => {
    if(info){
      let newInfo: ImageInfo = { ...info, tags: info.tags?.filter(t => t.name !== tag.name || t.type !== tag.type) }
      saveImageInfos(savedInfos.map(i => i.path === newInfo.path ? newInfo : i))
      onImageChanged(newInfo)
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
              <div style={{ backgroundColor: getBackgroundColor(tag.type) }} className="info_tag" onClick={selectTag(tag)} onContextMenu={deleteTag(tag)}>{tag.name}</div>
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
