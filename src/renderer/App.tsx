import React, { useEffect, useState, useRef, useContext } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { FcOpenedFolder } from 'react-icons/fc';
import { BiSolidChevronDown } from 'react-icons/bi';
import MessageModal from './components/MessageModal';
import ImageViewer from './components/ImageViewer';
import { Action, Chapter, ImageInfo, ModalProps, Tag, UpdateHistoryProps, actions, initFilter } from './constant/types';
import InfoPanel from './components/InfoPanel';
import OrganizePanel from './components/OrganizePanel';
import FilterPanel from './components/FilterPanel';
import { AppContext, ModalContext } from './constant/context';
import { Buffer } from 'buffer';
import { useImageInfos } from './constant/hooks';
import ImageScrollView from './components/ImageScrollView';
const extract = require('png-chunks-extract')
const text = require('png-chunk-text')


// todo unload images -2/+2 page using intersect observer

const maxImageLoad = 30;
let isViewingFullScreen = false;
let viewIndex = 0;
let showDropDown = false;
let folderIndex = -1;
let showOrganizePanel = false;
let showInfoPanel = false;
let isQuickAdding = false;
let prevUpdatedImage = "";

function Hello() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [paths, setPaths] = useState([]);
  const { modal, setModal } = useContext(ModalContext)
  const [updateHistory, setUpdateHistory] = useState<UpdateHistoryProps[]>([])
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [tags, setTags] = useState<Tag[]>([]);
  const [chapter, setChapter] = useState<Chapter>({ name: "", images: [], createDate: 0, modifiedDate: 0 })
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [addType, setAddType] = useState<string>(actions.ADD_TAG)
  const { savedInfos, saveImageInfos } = useContext(AppContext)
  const imagesRef = useRef<any>();
  const pathsRef = useRef<any>([]);
  const imageInfoRef = useRef<ImageInfo | null>();
  const tagsRef = useRef<Tag[]>([]);
  const updateHistoryRef = useRef<UpdateHistoryProps[]>([]);
  const addTypeRef = useRef<string>();
  const chapterRef = useRef<Chapter>();
  const chaptersRef = useRef<Chapter[]>([]);

  imagesRef.current = images;
  pathsRef.current = paths;
  imageInfoRef.current = imageInfo;
  tagsRef.current = tags;
  updateHistoryRef.current = updateHistory;
  addTypeRef.current = addType;
  chapterRef.current = chapter;
  chaptersRef.current = chapters;

  useEffect(() => {
    if(chapter.name){
      setChapter(chapters[chapters.findIndex((c: Chapter) => c.name === chapter.name)])
    }
  }, [chapters])

  const loadDirectoryPaths = () => {
    const rawJSON = localStorage.getItem("savedPaths")
    if(rawJSON){
      setPaths(JSON.parse(rawJSON))
    }
  }

  const loadChapters = () => {
    const rawJSON = localStorage.getItem("chapters")
    if(rawJSON){
      setChapters(JSON.parse(rawJSON))
    }
  }

  useEffect(() => {
    document.onkeydown = async (e: KeyboardEvent) => {
      if(e.code.includes("Control")){
        isQuickAdding = true
      }
      if(pathsRef.current.length > 0 && (e.code === 'ArrowDown' || e.code === 'ArrowUp')){
        if(e.code === 'ArrowDown'){
          folderIndex = folderIndex === pathsRef.current.length - 1 ? 0 : folderIndex + 1
        }else{
          folderIndex = folderIndex < 1 ? pathsRef.current.length - 1 : folderIndex - 1
        }
        const data = await window.electron.onDirectoryChosen(pathsRef.current[folderIndex])
        if(data){
          setImages(data.images);
          loadImageFromDirectory(data.dirPath, data.images)
        }
      }
      if (isViewingFullScreen && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')){
        if (e.code === 'ArrowLeft') {
          viewIndex =
            viewIndex === 0 ? imagesRef.current.length - 1 : viewIndex - 1;
        }
        if (e.code === 'ArrowRight') {
          viewIndex =
            viewIndex === imagesRef.current.length - 1 ? 1 : viewIndex + 1;
        }
        const image = document.querySelector(`.viewer_image`) as HTMLImageElement;
        image.src = `http://localhost:4000/${imagesRef.current[viewIndex].path.substring(3).replace(/\\/g, "/").replace(/ /g, "_")}`;
        removeOverlap();
      }
    };
    document.onkeyup = (e: KeyboardEvent) => {
      if(e.code.includes("Control")){
        isQuickAdding = false
      }
    }
    loadDirectoryPaths()
    loadChapters()
  }, []);

  const removeOverlap = () => {
    const overlap = document.querySelector('.image_overlap') as HTMLElement;
    if (overlap) {
      (document.querySelector('.content') as HTMLElement).removeChild(overlap);
    }
  };

  const updateSourceText = (dirPath: string) => {
    // const columns = document.querySelectorAll(".column") as NodeListOf<HTMLElement>
    // for(let column of columns){
    //   column.innerHTML = ""
    // }
    (document.querySelector('.folder_source>div>span') as HTMLSpanElement).innerText = dirPath
  }

  const loadImageFromDirectory = async (dirPath: string, images: ImageInfo[]) => {
    if (dirPath) {
      saveDirPath(dirPath);
      updateSourceText(dirPath);
      const res = await fetch('http://localhost:4000/streamImage', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Allow-Control-Access-Origin': '*',
        },
        body: JSON.stringify({ dirURL: dirPath }),
      });
    }
  };

  const openDirectory = async () => {
    const data = await window.electron.chooseDirectory(maxImageLoad);
    if(data){
      setImages(data.images);
      loadImageFromDirectory(data.dirPath, data.images)
    }
  }

  const showImageInfo = (info: ImageInfo) => {
    if(info.name === imageInfo?.name && info.path === imageInfo?.path && showInfoPanel){
      return;
    }
    setImageInfo({
      ...info,
      chapters: chaptersRef.current
      .filter((c: Chapter) => c.images?.findIndex(i => i.name === info.name && i.path === info.path) !== -1)
      .map((c: Chapter) => c.name) });
    const infoPanel = document.querySelector(".info_panel") as HTMLElement;
    const scrollView = document.querySelector(".image_scroll_view") as HTMLElement;
    if(!showInfoPanel){
      scrollView.style.transition = "margin-right 0.3s ease-out"
      scrollView.style.marginRight = `min(35%, 405px)`
      infoPanel.style.transition = "top 0.4s ease-out 0.3s"
      infoPanel.style.top = "0"
    }
    showInfoPanel = true
  }

  const toFullScreen = (
    e: React.MouseEvent,
    index: number
  ) => {
    if (isViewingFullScreen) return;
    isViewingFullScreen = true;
    viewIndex = index;
    (document.querySelector(".viewer_image") as HTMLImageElement).src = ""
    const image = e.target as HTMLImageElement;
    const naturalHeight = image.naturalHeight;
    const container = document.querySelector('.content') as HTMLElement;
    const bounds = image.getBoundingClientRect();
    const tag = document.createElement('img');
    tag.className = 'image_overlap';
    tag.style.width = `${image.clientWidth}px`;
    tag.style.left = '0';
    tag.style.top = '0';
    tag.style.transform = `translate(${bounds.x}px, ${bounds.y}px)`;
    tag.src = image.src;
    const scaleFactor = Math.min(
      (window.innerHeight * 0.95) / image.clientHeight,
      naturalHeight / image.clientHeight
    );
    tag.onload = () => {
      container.appendChild(tag);
      image.style.opacity = '0';
      tag.style.transform = `scale(${scaleFactor})  translate(calc((50vw - ${
        image.clientWidth / 2
      }px)/${scaleFactor}), calc((50vh - ${
        image.clientHeight / 2
      }px)/${scaleFactor}))`;
      tag.style.zIndex = '10';
      const modal = document.querySelector('.image_viewer') as HTMLElement;
      modal.style.zIndex = '5';
      modal.style.opacity = '1';
      modal.onclick = () => {
        image.style.opacity = '1';
        tag.style.opacity = '0';
        modal.style.opacity = '0';
        setTimeout(() => {
          modal.style.zIndex = '-1';
          removeOverlap();
          isViewingFullScreen = false;
        }, 450);
      };
      document.onvisibilitychange = () => {
        if(document.visibilityState === "visible"){
          setTimeout(() => {
            modal.onclick = () => {
              image.style.opacity = '1';
              tag.style.opacity = '0';
              modal.style.opacity = '0';
              setTimeout(() => {
                modal.style.zIndex = '-1';
                removeOverlap();
                isViewingFullScreen = false;
              }, 450);
            };
          }, 500)
        }else{
          modal.onclick = null
        }
      }
    };
  };

  const onImageContextMenu = (image: ImageInfo) => {
    if(addTypeRef.current === actions.ADD_TAG){
      addTagToImage(image.name, image.path, image.type, image.createdDate)
    }else{
      addImageToChapter(image.name, image.path)
    }
  }

  const onImageMouseEnter = (e: React.MouseEvent, image: ImageInfo) => {
    const infoIcon = (e.target as HTMLElement).parentElement?.childNodes[3] as HTMLElement;
    if(!isQuickAdding){
      if(infoIcon){
        infoIcon.style.right = "5px"
        infoIcon.style.rotate = "0deg"
      }
    }else{
      if(addTypeRef.current === actions.ADD_TAG){
        addTagToImage(image.name, image.path, image.type, image.createdDate)
      }else{
        addImageToChapter(image.name, image.path)
      }
    }
  }

  const onImageMouseLeave = (e: React.MouseEvent, image: ImageInfo) => {
    const infoIcon = (e.target as HTMLElement).parentElement?.childNodes[3] as HTMLElement;
    if(!isQuickAdding && infoIcon){
      infoIcon.style.right = "-20px"
      infoIcon.style.rotate = "75deg"
    }
    if(prevUpdatedImage === image.name){
      prevUpdatedImage = ""
    }
  }

  const addTagToImage = (name: string, path: string, type: string | undefined, createdDate: number | undefined) => {
    if(addTypeRef.current !== actions.ADD_TAG || prevUpdatedImage === name) return;

    if(tagsRef.current.length > 0){
      prevUpdatedImage = name;
      let newInfos = [...savedInfos]
      const index = newInfos.findIndex(i => i.path === path);
      if(index !== -1){
        newInfos[index] = {
          path: path,
          name: name,
          type: type,
          tags: newInfos[index].tags?.filter(t => !tagsRef.current.find(t2 => t.name === t2.name && t.type === t2.type)).concat(tagsRef.current),
          createdDate: createdDate,
          lastModifiedDate: Date.now()
        }
      }else{
        newInfos.push({ name, path, type, tags: tagsRef.current, createdDate, lastModifiedDate: Date.now() })
      }
      saveImageInfos(newInfos)
      setUpdateHistory(updateHistoryRef.current.concat({ name, path, tags }))
    }else{
      setModal({ visible: true, message: "Oops! No tag to add..." })
    }
  }

  const saveDirPath = (path: string) => {
    const rawJSON = localStorage.getItem('savedPaths');
    let savedPaths: string[] | any = [];
    if (rawJSON) {
      savedPaths = JSON.parse(rawJSON);
      if (!savedPaths.includes(path)) {
        savedPaths = [path].concat(savedPaths);
        localStorage.setItem('savedPaths', JSON.stringify(savedPaths));
      }
    } else {
      savedPaths = [path];
      localStorage.setItem('savedPaths', JSON.stringify(savedPaths));
    }
    setPaths(savedPaths);
  };

  const toggleDropdown = () => {
    const dropdown = document.querySelector(".folder_source_dropdown") as HTMLElement
    if(showDropDown){
      dropdown.style.top = "25"
      dropdown.style.opacity = "0"
      setTimeout(() => {
        dropdown.style.display = "none"
      }, 400)
    }else{
      dropdown.style.display = "block"
      setTimeout(() => {
        dropdown.style.top = "25"
        dropdown.style.opacity = "1"
      }, 10)
    }
    showDropDown = !showDropDown
  }

  const onBlur = () => {
    const dropdown = document.querySelector(".folder_source_dropdown") as HTMLElement;
    const chapterMenu = document.querySelector(".chapter_menu") as HTMLElement;
    dropdown.style.top = "25"
    dropdown.style.opacity = "0"
    setTimeout(() => {
      dropdown.style.display = "none"
    }, 400)
    showDropDown = false
    chapterMenu.style.display = "none"
  }

  const onDropdownItemClicked = (path: string) => async (e: React.MouseEvent) => {
    const data = await window.electron.onDirectoryChosen(path)
    if(data){
      setImages(data.images);
      loadImageFromDirectory(data.dirPath, data.images)
    }
    toggleDropdown()
  }

  const toggleOrganizeView = () => {
    const view = document.querySelector(".organize_view") as HTMLElement;
    const scrollView = document.querySelector(".image_scroll_view") as HTMLElement
    if(showOrganizePanel){
      if(!showInfoPanel){
        scrollView.style.transition = "margin-right 0.4s ease-out 0.3s"
        scrollView.style.marginRight = "0"
      }
      view.style.transition = "top 0.3s ease-out"
      view.style.top = "100%"
    }else{
      scrollView.style.transition = "margin-right 0.3s ease-out"
      scrollView.style.marginRight = `min(35%, 405px)`
      view.style.transition = "top 0.4s ease-out 0.3s"
      view.style.top = "0"
    }
    showOrganizePanel = !showOrganizePanel
  }

  const closeInfoPanel = () => {
    const infoPanel = document.querySelector(".info_panel") as HTMLElement;
    const scrollView = document.querySelector(".image_scroll_view") as HTMLElement;
    if(!showOrganizePanel){
      scrollView.style.transition = "margin-right 0.4s ease-out 0.3s"
      scrollView.style.marginRight = "0"
    }
    infoPanel.style.transition = "top 0.3s ease-out"
    infoPanel.style.top = "100%"
    infoPanel.ontransitionend = () => {
      setImageInfo(null)
      infoPanel.ontransitionend = null
    }
    showInfoPanel = false
  }

  const createChapter = (e: KeyboardEvent) => {
    if(e.code === "Enter"){
      const rawJSON = localStorage.getItem("chapters");
      let savedChapters: Chapter[] = [];
      if(rawJSON){
        savedChapters = JSON.parse(rawJSON)
      }
      const chapterName = (document.querySelector("#add_chapter_input") as HTMLInputElement).value;
      if(savedChapters.findIndex(c => c.name === chapterName) !== -1){
        setModal({ visible: true, message: "Chapter existed" })
        return;
      }
      if(chapterName.length >= 3 && chapterName.length <= 40){
        savedChapters.push({ name: chapterName, images: [], createDate: Date.now(), modifiedDate: Date.now() });
        setChapters(savedChapters);
        localStorage.setItem("chapters", JSON.stringify(savedChapters));
      }else{
        setModal({ visible: true, message: "Chapter name must be longer than 2 characters" })
      }
    }
  }

  const onChapterAction = (isAddingImage: boolean) => setAddType(isAddingImage ? actions.ADD_CHAPTER_IMAGE : actions.ADD_TAG)

  const onChapterSelected = (c: Chapter) => setChapter(c)

  const addImageToChapter = (name: string, path: string) => {
    const newChapters = chaptersRef.current.map(c => {
      if(c.name === chapterRef.current?.name && c.images?.findIndex(i => i.path === path) === -1){
        setChapter({ ...c, images: c.images.concat([{ name, path }])})
        return {
          ...c,
          images: c.images?.concat([{ name, path }])
        }
      }
      return c
    })
    setChapters(newChapters);
    localStorage.setItem("chapters", JSON.stringify(newChapters))
  }

  const onViewingChapter = async (chapter: Chapter) => {
    let images = chapter.images || [];
    if(images.length > 0){
      updateSourceText(chapter.name)
      images = images.map(i => ({ ...i, ...(savedInfos.find(i2 => i.name === i2.name && i.path === i2.path) || {})}));
      let paths = new Set(images.map(i => i.path).map(path => path.substring(0, path.lastIndexOf("\\"))));
      let isAvailable = true;
      for(let path of paths){
        const res = await fetch('http://localhost:4000/streamImage', {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Allow-Control-Access-Origin': '*',
          },
          body: JSON.stringify({ dirURL: path }),
        });
        isAvailable = await res.json()
      }
      if(isAvailable){
        setImages(images)
        // appendImagesToUI(images)
      }
    }else{
      setImages([])
    }
  }

  const onDeletingChapterImage = (imageIndex: number) => {
    let newChapter: Chapter = { ...chapter, images: chapter?.images?.slice(0, imageIndex).concat(chapter.images.slice(imageIndex+1)), modifiedDate: Date.now() }
    let newChapters = chapters.map(c => c.name === newChapter.name ? newChapter : c);
    localStorage.setItem("chapters", JSON.stringify(newChapters));
    setChapters(newChapters)
    onViewingChapter(newChapter)
  }

  const onChangingImageIndex = (fromIndex: number, toIndex: number) => {
    let newChapters = chapters.map((c: Chapter) => {
      if(chapter.name === c.name && chapter.images){
        let newImages = chapter.images.slice(0, fromIndex).concat(chapter.images.slice(fromIndex+1));
        newImages.splice(toIndex, 0, chapter.images[fromIndex]);
        return {
          ...chapter,
          images: newImages
        }
      }
      return c
    })
    setChapters(newChapters)
    onViewingChapter(newChapters[chapters.findIndex((c: Chapter) => c.name === chapter.name)])
  }

  const onDeletingChapter = (chapterName: string) => {
    let newChapters = chapters.filter((c: Chapter) => c.name === chapterName);
    setChapters(newChapters);
    localStorage.setItem("chapters", JSON.stringify(newChapters))
  }

  const openFilterPanel = () => {
    const panel = document.querySelector(".filter_panel") as HTMLElement;
    // const lines = document.querySelectorAll(".anchor_background span");
    panel.style.transition = "top 0.6s ease-out";
    panel.style.top = "0";
    // panel.ontransitionend = () => {
    //   panel.style.transition = ""
    //   for(let i = 1; i <= 4; i++){
    //     (lines[i-1] as HTMLElement).style.animation = `collapse${i} 0.3s ease-out forwards`;
    //   }
    // }
  }

  const matchTagWithSDPrompt = async () => {
    if(images.length === 0) return;

    let stopProcess = false
    setModal({ ...modal, visible: false })
    const processView = document.querySelector(".processing") as HTMLElement;
    const processText = processView.childNodes[1] as HTMLSpanElement;
    processView.style.display = "flex"
    processText.innerText = `Processing (${images.length})`
    processView.onmouseenter = () => {
      processText.innerText = processText.innerText.replace("Processing", "Stop")
      processView.style.backgroundColor = "indigo"
    }
    processView.onmouseleave = () => {
      processText.innerText = processText.innerText.replace("Stop", "Processing")
      processView.style.backgroundColor = ""
    }
    processView.onclick = () => {
      stopProcess = true
    }
    let newInfos = [...savedInfos]
    let buffer: Buffer;
    let matchTags: Tag[] = [];
    for(let i = 0; i < images.length; i++){
      if(stopProcess){
        processText.innerText = `Processing (0)`
        processView.style.backgroundColor = ""
        processView.style.display = "none"
        processView.onmouseenter = null
        processView.onmouseleave = null
        processView.onclick = null
        return;
      }
      let image = images[i];
      let res = await fetch(`http://localhost:4000/${image.path.substring(3).replace(/\\/g, "/").replace(/ /g, "_")}`);
      buffer = Buffer.from(await res.arrayBuffer());
      let chunks = extract(buffer);
      const textChunks = chunks.filter((chunk: any) => chunk.name === "tEXt").map((chunk: any) => text.decode(chunk.data));
      if(textChunks[0]?.text){
        let promptSplit: string[] = textChunks[0].text.split("\n")[0].replace(/<lora:.{1,}>|\(|\)|\[|\]|\b:\d{1}.{0,1}\d{0,}|\B\s/g, "").split(",");
        for(let tag of promptSplit){
          let index = tags.findIndex((t: Tag) => tag === t.name);
          if(index !== -1){
            matchTags.push(tags[index])
          }
        }
        if(matchTags.length > 0){
          let imageIndex = newInfos.findIndex((i: ImageInfo) => i.name === image.name && i.path === image.path);
          let newTags = newInfos[imageIndex]?.tags ? newInfos[imageIndex].tags?.filter((t) => !matchTags.some((t2) => t2.name === t.name && t2.type === t.type)).concat(matchTags) : matchTags;
          if(imageIndex !== -1){
            newInfos[imageIndex] = { ...newInfos[imageIndex], tags: newTags, lastModifiedDate: Date.now() }
          }else{
            newInfos.push({ ...image, tags: newTags, lastModifiedDate: Date.now() })
          }
          setUpdateHistory(updateHistoryRef.current.concat([{ name: image.name, path: image.path, tags: matchTags }]))
          matchTags = []
        }
      }
      processText.innerText = `Processing (${images.length - i})`
    }
    saveImageInfos(newInfos)
    processView.style.display = "none"
    processView.onmouseenter = null
    processView.onmouseleave = null
    processView.onclick = null
  }

  const onQuickMatch = () => {
    setModal({ visible: true, message: `Do you want to quick match ${images.length} image(s)?`, onSubmit: matchTagWithSDPrompt })
  }

  const clearHistory = () => setUpdateHistory([])

  const deleteSource = (index: number) => () => {
    let newSources = paths.filter((p, i) => i !== index)
    setPaths(newSources)
    localStorage.setItem("savedPaths", JSON.stringify(newSources))
  }

  return (
    <div className="content">
      <div className="status_bar">
        <span className="connection_status">Connected</span>
        <div className="divider" />
        <div className="folder_source">
          <div onClick={toggleDropdown}>
            <span>Choose a source...</span>
            <BiSolidChevronDown className="dropdown_icon" />
          </div>
          <div className="folder_source_dropdown">
            <ul>
              {paths.map((path: string, index) => (
                <li>
                  <span onClick={onDropdownItemClicked(path)}>{path}</span>
                  <span className='remove_source' onClick={deleteSource(index)}>remove</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="choose_folder_source">
          <div className="background" onClick={openDirectory} />
          <FcOpenedFolder className="folder_icon" />
        </div>
        <div className="divider" />
        <span className="transfer">
          <div className="background" />
          Transfer
        </span>
        <span className='filter' onClick={openFilterPanel}>
          <div className="background"></div>
          Filter
        </span>
        <span className="organize" onClick={toggleOrganizeView}>
          <div className="background" />
          Organize
        </span>
      </div>
      <div className="img_container" onClick={onBlur}>
        <ImageScrollView
          selectedImage={imageInfo}
          images={images}
          onImageClicked={toFullScreen}
          onImageContextMenu={onImageContextMenu}
          onImageMouseEnter={onImageMouseEnter}
          onImageMouseLeave={onImageMouseLeave}
          onInfoIconClicked={showImageInfo}
        />
        <OrganizePanel
          tags={tags}
          chapter={chapter}
          chapters={chapters}
          updateHistory={updateHistory}
          addType={addType}
          onTagListChanged={setTags}
          onChapterInput={createChapter}
          onChapterSelected={onChapterSelected}
          onChapterAction={onChapterAction}
          onViewingChapter={onViewingChapter}
          onDeletingChapterImage={onDeletingChapterImage}
          onChangingImageIndex={onChangingImageIndex}
          onDeletingChapter={onDeletingChapter}
          onQuickMatch={onQuickMatch}
          clearHistory={clearHistory}
        />
        <InfoPanel info={imageInfo} onPanelClosed={closeInfoPanel}/>
      </div>
      <ImageViewer/>
      <MessageModal/>
      <FilterPanel/>
    </div>
  );
}

export default function App() {
  const [modal, setModal] = useState<ModalProps>({ visible: false, message: "" })
  const [savedInfos, saveImageInfos] = useImageInfos()
  const [imageFilter, setImageFilter] = useState(initFilter)

  return (
    <Router>
      <AppContext.Provider value={{ savedInfos, saveImageInfos, imageFilter, setImageFilter }}>
        <ModalContext.Provider value={{ modal, setModal }}>
          <Routes>
            <Route path="/" element={<Hello />} />
          </Routes>
        </ModalContext.Provider>
      </AppContext.Provider>
    </Router>
  );
}
