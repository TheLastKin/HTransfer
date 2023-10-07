import React, { useEffect, useState, useContext } from 'react';
import '../componentCss/filter_panel.css';
import { ImageInfo, Tag, UniqueGroup, UniqueTag, actions, activeColor, charTagColor, commonTagColor, getBackgroundColor, specialTagColor } from 'renderer/constant/types';
import { BsArrowUp, BsArrowDown, BsArrowLeft, BsArrowRight } from 'react-icons/bs'
import { AppContext } from 'renderer/constant/context';
import { BiSolidChevronRight, BiSolidChevronLeft, BiSearchAlt2, BiSolidChevronDown } from 'react-icons/bi'
import { IoMdClose } from 'react-icons/io'

type FilterPanelProps = {
  currentSource: string,
  onUpdatingAllTags: (tag: UniqueTag, type: string) => void
}

let anchorPoint = 0
let initialTags: UniqueTag[] = []

let tagSortBy = ["Alphabet", "Type", "Occurences"]
let imageSortBy = ["Date created", "Date modified", "Most relevant"]
let extraInfo = ["Image index", "Image name", "SD Image"]
let extraSettings = ["By tag order", "Without selected tag"]

const FilterPanel = ({ currentSource, onUpdatingAllTags }: FilterPanelProps) => {
  const [tags, setTags] = useState<UniqueTag[]>([])
  const [tagFilter, setTagFilter] = useState({ type: "Alphabet", asc: true, showInGroup: false })
  const [searchText, setSearchText] = useState("")
  const { savedInfos, imageFilter, setImageFilter } = useContext(AppContext)

  useEffect(() => {
    getUniqueTags();
  }, [savedInfos, currentSource])

  useEffect(() => {
    if(tags.length > 0){
      setTags(getSortedTags(tags))
    }
  }, [tagFilter])

  const getUniqueTags = () => {
    if(savedInfos.length === 0) return;

    initialTags = []

    for(let info of savedInfos){
      if(!info.tags || (currentSource.length > 0 && currentSource !== info.path.substring(0, info.path.lastIndexOf("\\")))) continue;

      for(let tag of info.tags){
        let index = initialTags.findIndex((t) => t.name === tag.name && t.type === tag.type);
        if(index !== -1){
          initialTags[index].numberOfOccurence += 1;
        }else{
          initialTags.push({ ...tag, numberOfOccurence: 1 })
        }
      }
    }
    setTags(getSortedTags(initialTags))
  }

  const onMouseDown = (e: React.MouseEvent) => {
    anchorPoint = 12
    window.onmousemove = onMouseMove
    window.onmouseup = onMouseUp
    document.body.style.cursor = "grab"
  }

  const onMouseUp = () => {
    anchorPoint = 0
    window.onmousemove = null
    window.onmouseup = null
    document.body.style.cursor = ""
  }

  const onMouseMove = (e: MouseEvent) => {
    if(anchorPoint !== 0){
      const panel = document.querySelector(".filter_panel") as HTMLElement;
      panel.style.top = `-${Math.min(Math.max(178 - (e.clientY - anchorPoint), 0), 178)}px`
    }
  }

  const swapTagFilter = (type: string, showInGroup: boolean | null = null) => () => {
    if(showInGroup !== null){
      setTagFilter({ ...tagFilter, showInGroup: showInGroup })
      return;
    }
    if(tagFilter.type === type){
      setTagFilter({ ...tagFilter, asc: !tagFilter.asc })
      return;
    }
    setTagFilter({...tagFilter, type: type, asc: true })
  }

  const getTypeValue = (type: string) => type === "common" ? 7 : (type === "char" ? 4 : 1)

  const getUniqueTagGroup = () => {
    let groups: UniqueGroup[] = [];
    if(tagFilter.showInGroup){
      for(let tag of tags){
        let index = groups.findIndex((group) => group.name === tag.type);
        if(index === -1){
          groups.push({ name: tag.type, numberOfTags: 1 })
        }else{
          groups[index].numberOfTags += 1
        }
      }
      groups.sort((a: UniqueGroup, b: UniqueGroup) => getTypeValue(b.name) - getTypeValue(a.name))
    }else{
      groups.push({ name: "All", numberOfTags: tags.length })
    }
    return groups
  }

  const getSortedTags = (tags: UniqueTag[]) => {
    let newTags = [...tags];
    if(tagFilter.type === "Alphabet"){
      newTags.sort((a: UniqueTag, b: UniqueTag) => tagFilter.asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
    }
    if(tagFilter.type === "Type"){
      newTags.sort((a: UniqueTag, b: UniqueTag) => tagFilter.asc ?
      (getTypeValue(b.type) + a.name.localeCompare(b.name)) - getTypeValue(a.type) :
      (getTypeValue(a.type) + a.name.localeCompare(b.name)) - getTypeValue(b.type))
    }
    if(tagFilter.type === "Occurences"){
      newTags.sort((a: UniqueTag, b: UniqueTag) => tagFilter.asc ? a.numberOfOccurence - b.numberOfOccurence : b.numberOfOccurence - a.numberOfOccurence)
    }
    return newTags
  }

  const setImageSortBy = (value: string) => () => {
    if(imageFilter?.sortBy.type === value){
      setImageFilter({ ...imageFilter, sortBy: { type: value, asc: !imageFilter.sortBy.asc }})
    }else{
      setImageFilter({ ...imageFilter, sortBy: { type: value, asc: true }})
    }
  }

  const setExtraInfo = (key: string) => () => {
    setImageFilter({ ...imageFilter, extraInfo: { ...imageFilter.extraInfo, [key]: !(imageFilter.extraInfo as any)[key] }})
  }

  const setExtraSetting = (type: string) => () => {
    if(type === "by tag order"){
      let type = imageFilter.extraSettings.viewByTagOrder;
      setImageFilter({ ...imageFilter, extraSettings: { viewByTagOrder: type.length === 0 ? "leftToRight" : (type === "leftToRight" ? "rightToLeft" : ""), withoutSelectedTags: false }})
    }else{
      setImageFilter({ ...imageFilter, extraSettings: { viewByTagOrder: "", withoutSelectedTags: !imageFilter.extraSettings.withoutSelectedTags }})
    }
  }

  const selectTag = (tag: Tag) => () => {
    setImageFilter({ ...imageFilter, selectedTags: imageFilter.selectedTags.concat([tag])})
  }

  const removeTag = (tag: Tag) => () => {
    setImageFilter({ ...imageFilter, selectedTags: imageFilter.selectedTags.filter(t => t.name !== tag.name || t.type !== tag.type)})
  }

  const onSearching = (e: React.FormEvent) => {
    setSearchText((e.target as HTMLInputElement).value)
  }

  const clearSearch = () => {
    setSearchText("")
  }

  const toggleTagGroup = (e: React.MouseEvent) => {
    const container = (e.target as HTMLElement).parentElement as HTMLElement;
    if(container.className === "tag_group"){
      const listView = container.querySelector(".tag_list") as HTMLElement
      const chevron = container.querySelector(".toggle_expand") as HTMLElement;
      if(listView.style.height === "0px"){
        listView.style.height = "auto"
        chevron.style.rotate = "0deg"
      }else{
        listView.style.height = "0"
        chevron.style.rotate = "-90deg"
      }
    }
  }

  const onTagContextMenu = (tag: UniqueTag) => (e: React.MouseEvent) => {
    const menu = document.querySelector(".tag_context_menu") as HTMLElement;
    menu.style.left = `${e.clientX - 10}px`;
    menu.style.top = `${e.clientY - 40}px`;
    menu.style.display = "block";
    (menu.firstChild as HTMLElement).onclick = () => onUpdatingAllTags(tag, "update");
    (menu.lastChild as HTMLElement).onclick = () => onUpdatingAllTags(tag, "delete");
  }

  const blurMenu = () => {
    const menu = document.querySelector(".tag_context_menu") as HTMLElement;
    menu.style.display = "none";

  }

  return (
    <div className='filter_panel' onClick={blurMenu}>
      <div className="filter_panel_content">
        <div className="filter_panel_left">
          <div className="image_tag_filter">
            <div>
              {imageFilter.selectedTags.map((t, index, arr) => (
                <div className='selected_tag'>
                  <div style={{ backgroundColor: getBackgroundColor(t.type) }} className="tag" onClick={removeTag(t)}>
                    {t.name}
                  </div>
                  {imageFilter.extraSettings.viewByTagOrder.length > 0 && index !== arr.length-1 ? (imageFilter.extraSettings.viewByTagOrder === "leftToRight" ? <BiSolidChevronRight/> : <BiSolidChevronLeft/>) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="image_filters">
            <div className="image_sort_by">
              <span>Image sort:</span>
              {imageSortBy.map(value => (
                <div style={{ color: imageFilter.sortBy.type === value ? activeColor : "white", opacity: imageFilter.extraSettings.viewByTagOrder.length > 0 ? 0.65 : 1 }} className="radio_group" onClick={setImageSortBy(value)}>
                  {value === imageFilter?.sortBy.type ? (imageFilter.sortBy.asc ? <BsArrowUp/> : <BsArrowDown/>) : <BsArrowUp/>}
                  <div className="radio_value">{value}</div>
                </div>
              ))}
            </div>
            <div className="image_utils">
              <span>Extra info: </span>
              {Object.keys(imageFilter.extraInfo).map((key, index) => (
                <div style={{ color: (imageFilter.extraInfo as any)[key] ? activeColor : "white" }} className="radio_group" onClick={setExtraInfo(key)}>
                  <div className="radio_value">{extraInfo[index]}</div>
                </div>
              ))}
            </div>
            <div className="image_extra">
              <span>Extra settings: </span>
              <div style={{ color: imageFilter.extraSettings.viewByTagOrder.length > 0 ? activeColor : "white" }} className="radio_group" onClick={setExtraSetting("by tag order")}>
                {imageFilter?.extraSettings.viewByTagOrder === "rightToLeft" ? <BsArrowLeft/> : <BsArrowRight/>}
                <div className="radio_value">{extraSettings[0]}</div>
              </div>
              <div style={{ color: imageFilter.extraSettings.withoutSelectedTags ? activeColor : "white" }} className="radio_group" onClick={setExtraSetting("without selected tags")}>
                <div className="radio_value">{extraSettings[1]}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="filter_panel_right">
          <div className="tag_filter">
            <div className="tag_sort_by">
              <div className="heading">Sort by: </div>
              {tagSortBy.map(value => (
                <div style={{ color: value === tagFilter.type ? activeColor : "white" }} className="radio_group" onClick={swapTagFilter(value)}>
                  {value === tagFilter.type ? (tagFilter.asc ? <BsArrowUp/> : <BsArrowDown/>) : <BsArrowUp/>}
                  <div className="radio_value">{value}</div>
                </div>
              ))}
            </div>
            <div className="search_tag">
              <BiSearchAlt2 className='search_icon'/>
              <input type="text" id="search_tag_input" onInput={onSearching} value={searchText}/>
              <IoMdClose className='clear_search' onClick={clearSearch}/>
            </div>
            <div className="tag_group_by">
              <div style={{ color: tagFilter.showInGroup ? activeColor : "white" }} className="check_group" onClick={swapTagFilter("", !tagFilter.showInGroup)}>
                <div className="check_value">Show in group</div>
              </div>
            </div>
          </div>
          <div className="tag_groups">
            {getUniqueTagGroup().map((group) => (
              <div className="tag_group">
                <div className="heading" onClick={toggleTagGroup}>
                  <BiSolidChevronDown className='toggle_expand'/>
                  <span>{group.name + ` (${group.numberOfTags})`}</span>
                  <span></span>
                </div>
                <div className="tag_list">
                  {tags.filter((tag: UniqueTag) => tag.name.includes(searchText) && (tag.type === group.name || group.name === "All")).map(tag => (
                    <div style={{
                      display: imageFilter.selectedTags?.some(t => t.name === tag.name && t.type === tag.type) ? "none" : "flex",
                      backgroundColor: getBackgroundColor(tag.type)
                      }}
                      className="tag"
                      onClick={selectTag(tag)}
                      onContextMenu={onTagContextMenu(tag)}>
                      {tag.name + ` (${tag.numberOfOccurence})`}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="tag_context_menu">
          <div>Update All</div>
          <div>Remove All</div>
        </div>
      </div>
      <div className="anchor_point">
        <div className="anchor_front" onMouseDown={onMouseDown}></div>
        <div className="anchor_background">
          <div className="line_top">
            <span></span>
            <span></span>
          </div>
          <div className="line_bottom">
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
