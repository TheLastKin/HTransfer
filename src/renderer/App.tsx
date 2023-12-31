import React, { useEffect, useState, useRef, useContext } from 'react';
import './App.css';
import { FcOpenedFolder } from 'react-icons/fc';
import { BiSolidChevronDown } from 'react-icons/bi';
import MessageModal from './components/MessageModal';
import ImageViewer from './components/ImageViewer';
import { Chapter, HighlightImage, ImageInfo, ModalProps, SDProps, Tag, UniqueTag, UpdateHistoryProps, actions, colorGradients, initFilter, maxImageLoad } from './constant/types';
import InfoPanel from './components/InfoPanel';
import OrganizePanel from './components/OrganizePanel';
import FilterPanel from './components/FilterPanel';
import { AppContext, ModalContext } from './constant/context';
import { useAppSettings, useChapters, useImageFilter, useImageInfos } from './constant/hooks';
import ImageScrollView from './components/ImageScrollView';
import store from './constant/store';
import { FiDelete } from 'react-icons/fi'
import UpdateTagModal from './components/UpdateTagModal';
import SDWebUI from './components/SDWebUI';
import { MdOutlineSwitchLeft, MdOutlineSwitchRight } from 'react-icons/md'
import ExtraSettings from './components/ExtraSettings';
import ImagePreview from './components/ImagePreview';
import LinkTransferModal from './components/LinkTransferModal';
import { createWorkerFactory, useWorker } from '@shopify/react-web-worker';

const createWorker = createWorkerFactory(() => import("./workerFiles/loadSDPrompt"))

let isFullScreen = false;
let isViewingImage = false;
let viewIndex = 0;
let showDropDown = false;
let folderIndex = -1;
let showOrganizePanel = true;
let showInfoPanel = false;
let isQuickAdding = false;
let prevUpdatedImage = "";
let stopProcess = false

function Hello() {
  const [fileLoaded, setFileLoaded] = useState(false)
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [paths, setPaths] = useState([]);
  const { modal, setModal } = useContext(ModalContext);
  const [tagModal, setTagModal] = useState({ visible: false, type: "update", initialTag: { name: "", type: "common", numberOfOccurence: 0 }})
  const [transferModal, setTransferModal] = useState(false)
  const [updateHistory, setUpdateHistory] = useState<UpdateHistoryProps[]>([])
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [tags, setTags] = useState<Tag[]>([]);
  const [cIndex, setChapterIndex] = useState<number>(-1)
  const [addType, setAddType] = useState<string>(actions.ADD_TAG)
  const [currentSource, setCurrentSource] = useState("");
  const [switchTab, setSwitchTab] = useState(false);
  const [isWebUIOpened, setWebUIOpened] = useState(false);
  const { savedInfos, saveImageInfos, imageFilter, setImageFilter, appSettings, chapters, saveChapter, SDProps, setSDProps } = useContext(AppContext)
  const imagesRef = useRef<any>();
  const pathsRef = useRef<any>([]);
  const imageInfoRef = useRef<ImageInfo | null>();
  const tagsRef = useRef<Tag[]>([]);
  const updateHistoryRef = useRef<UpdateHistoryProps[]>([]);
  const addTypeRef = useRef<string>();
  const cIndexRef = useRef<number>(-1);
  const chaptersRef = useRef<Chapter[]>([]);
  const modalRef = useRef<ModalProps>();
  const webUIRef = useRef(isWebUIOpened);
  const currentSourceRef = useRef("");
  const switchTabRef = useRef(switchTab);
  const worker = useWorker(createWorker)

  imagesRef.current = images;
  pathsRef.current = paths;
  imageInfoRef.current = imageInfo;
  tagsRef.current = tags;
  updateHistoryRef.current = updateHistory;
  addTypeRef.current = addType;
  cIndexRef.current = cIndex;
  chaptersRef.current = chapters;
  modalRef.current = modal;
  currentSourceRef.current = currentSource;
  webUIRef.current = isWebUIOpened;
  switchTabRef.current = switchTab;

  const loadDirectoryPaths = async () => {
    const rawJSON = await store.get("savedPaths") as string
    if(rawJSON){
      setPaths(JSON.parse(rawJSON))
    }
  }

  const requestAssociatedFile = async () => {
    const imagePath: string = await window.electron.requestAssociatedFile();
    if(imagePath){
      isViewingImage = true;
      const modal = document.querySelector('.image_viewer') as HTMLElement;
      const imageView = document.querySelector('.viewer_image') as HTMLImageElement;
      imageView.src = imagePath;
      modal.style.zIndex = "5";
      modal.style.opacity = "1";
      imageView.style.opacity = '1';
      imageView.onload = () => {
        modal.ontransitionend = async () => {
          const source = imagePath.substring(0, imagePath.lastIndexOf("\\"));
          const data = await window.electron.onDirectoryChosen(source);
          setCurrentSource(source)
          if(Array.isArray(data.images)){
            setImages(data.images)
            setFileLoaded(true)
            viewIndex = data.images.findIndex((image: ImageInfo) => image.path === imagePath)
          }
          modal.ontransitionend = null
        }
        imageView.onload = null
      }
    }else{
      setFileLoaded(true)
    }
  }

  useEffect(() => {
    // saveImageInfos([])
    requestAssociatedFile()
    window.electron.switchTab(() => {
      toggleTab()
    })
    window.onkeydown = async (e: KeyboardEvent) => {
      if(e.code === "F1"){
        toggleOrganizeView()
        e.preventDefault()
      }
      if(e.code === "F2"){
        toggleFilterPanel()
        e.preventDefault()
      }
      if(e.code === "Escape" && modalRef.current?.visible){
        setModal({ ...modalRef.current, visible: false })
      }
      if(e.code === "Tab"){
        if(isViewingImage){
          window.electron.toggleFullScreen(!isFullScreen)
          isFullScreen = !isFullScreen
        }else{
          window.electron.toggleFullScreen(false)
        }
        e.preventDefault()
      }
      if(e.code.includes("Control") && !isQuickAdding){
        isQuickAdding = true
        for(let record of updateHistoryRef.current){
          const card = (document.querySelector(`.image_card[data-path="${record.path.replace(/\\/g, "\\\\")}"]`) as HTMLElement);
          if(card){
            card.className = "image_card image_card_highlight"
          }
        }
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
          loadImageFromDirectory(data.dirPath)
        }
        e.preventDefault()
      }
      if (isViewingImage && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')){
        if (e.code === 'ArrowLeft') {
          viewIndex =
            viewIndex === 0 ? imagesRef.current.length - 1 : viewIndex - 1;
        }
        if (e.code === 'ArrowRight') {
          viewIndex =
            viewIndex === imagesRef.current.length - 1 ? 1 : viewIndex + 1;
        }
        const image = document.querySelector(`.viewer_image`) as HTMLImageElement;
        image.src = imagesRef.current[viewIndex].path
        removeOverlap();
      }
    };
    window.onkeyup = (e: KeyboardEvent) => {
      if(e.code.includes("Control") && isQuickAdding){
        isQuickAdding = false
        for(let record of updateHistoryRef.current){
          const card = (document.querySelector(`.image_card[data-path="${record.path.replace(/\\/g, "\\\\")}"]`) as HTMLElement);
          if(card){
            card.className = "image_card"
          }
        }
      }
    }
    loadDirectoryPaths()
  }, []);

  useEffect(() => {
    loadSDPrompt()
  }, [images])

  useEffect(() => {
    loadImageWithoutSource()
    if(fileLoaded){
      store.set("imageFilter", JSON.stringify(imageFilter))
    }
  }, [imageFilter])

  const loadImageWithoutSource = () => {
    if(currentSource.length === 0 && imageFilter.selectedTags.length > 0){
      setImages(savedInfos.filter(i => i.tags?.find(t => imageFilter.selectedTags.some(t2 => t.name === t2.name && t.type === t2.type))))
    }
  }

  const onBackropClicked = (e: React.MouseEvent) => {
    const modal = e.target as HTMLElement;
    const imageOverlap = document.querySelector(".image_overlap") as HTMLElement;
    modal.style.opacity = '0';
    if(imageOverlap) imageOverlap.style.opacity = "0"
    setTimeout(() => {
      modal.style.zIndex = '-1';
      if(imageOverlap) imageOverlap.remove()
      isViewingImage = false;
    }, 450);
  }

  const removeOverlap = () => {
    const overlap = document.querySelector('.image_overlap') as HTMLElement;
    if (overlap) {
      overlap.remove()
    }
  };

  const loadImageFromDirectory = (dirPath: string) => {
    if (dirPath) {
      refreshScrollView()
      saveDirPath(dirPath);
      setCurrentSource(dirPath);
    }
  };

  const openDirectory = async () => {
    const data = await window.electron.chooseDirectory(maxImageLoad);
    if(data){
      refreshScrollView()
      setImages(data.images);
      loadImageFromDirectory(data.dirPath)
    }
  }

  const loadSDPrompt = async () => {
    let loadFor = currentSource;
    let SDProps: SDProps[] = []
    for(let i = 0; i < images.length; i++){
      if(loadFor !== currentSourceRef.current) return;
      let prop = await worker.loadSDPrompt(images[i]);
      if(prop){
        SDProps.push(prop)
      }
    }
    setSDProps(SDProps)
  }

  const showImageInfo = (info: ImageInfo) => {
    if(info.name === imageInfo?.name && info.path === imageInfo?.path && showInfoPanel){
      return;
    }
    const savedInfo = savedInfos.find(i => i.path === info.path);
    setImageInfo({
      ...info,
      ...savedInfo,
      chapters: chaptersRef.current
      .filter((c: Chapter) => c.images?.some(i => i.path === info.path))
      .map((c: Chapter) => c.name) });
    const infoPanel = document.querySelector(".info_panel") as HTMLElement;
    const scrollView = document.querySelector(".image_scroll_view") as HTMLElement;
    if(!showInfoPanel){
      scrollView.style.marginRight = "375px"
      infoPanel.style.right = "0"
    }
    showInfoPanel = true
  }

  const toFullScreen = (
    e: React.MouseEvent,
    index: number
  ) => {
    if (isViewingImage) return;
    isViewingImage = true;
    viewIndex = index;
    (document.querySelector(".viewer_image") as HTMLImageElement).src = ""
    const image = e.target as HTMLImageElement;
    const naturalHeight = image.naturalHeight;
    const container = document.querySelector('.content') as HTMLElement;
    const bounds = image.getBoundingClientRect();
    const imageOverlap = document.createElement('img');
    imageOverlap.className = 'image_overlap';
    imageOverlap.style.width = `${image.clientWidth}px`;
    imageOverlap.style.left = '0';
    imageOverlap.style.top = '0';
    imageOverlap.style.transform = `translate(${bounds.x}px, ${bounds.y}px)`;
    imageOverlap.src = image.src;
    imageOverlap.draggable = false;
    const scaleFactor = Math.min(
      (window.innerHeight * 0.95) / image.clientHeight,
      naturalHeight / image.clientHeight
    );
    imageOverlap.onload = () => {
      container.appendChild(imageOverlap);
      imageOverlap.style.transform = `scale(${scaleFactor})  translate(calc((50vw - ${
        image.clientWidth / 2
      }px)/${scaleFactor}), calc((50vh - ${
        image.clientHeight / 2
      }px)/${scaleFactor}))`;
      imageOverlap.style.zIndex = '10';
      const modal = document.querySelector('.image_viewer') as HTMLElement;
      modal.style.zIndex = '5';
      modal.style.opacity = '1';
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
    const infoIcon = (e.target as HTMLElement).parentElement?.querySelector(".info_icon") as HTMLElement;
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
    const infoIcon = (e.target as HTMLElement).parentElement?.querySelector(".info_icon") as HTMLElement;
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
      setUpdateHistory(updateHistoryRef.current.concat({ name, path, tags, status: "Updated" }))

      if(isQuickAdding){
        (document.querySelector(`.image_card[data-path="${path.replace(/\\/g, "\\\\")}"]`) as HTMLElement)!.className = "image_card image_card_highlight"
      }
    }
  }

  const saveDirPath = async (path: string) => {
    const rawJSON = await store.get('savedPaths') as string;
    let savedPaths: string[] | any = [];
    if (rawJSON) {
      savedPaths = JSON.parse(rawJSON);
      if (!savedPaths.includes(path)) {
        savedPaths = [path].concat(savedPaths);
        store.set('savedPaths', JSON.stringify(savedPaths));
      }
    } else {
      savedPaths = [path];
      store.set('savedPaths', JSON.stringify(savedPaths));
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
    const imagePreview = document.querySelector(".image_preview") as HTMLElement;
    dropdown.style.top = "25"
    dropdown.style.opacity = "0"
    setTimeout(() => {
      dropdown.style.display = "none"
    }, 400)
    showDropDown = false
    chapterMenu.style.display = "none"
    imagePreview.style.opacity = "0"
    imagePreview.style.zIndex = "-1"
  }

  const onDropdownItemClicked = (path: string) => async (e: React.MouseEvent) => {
    const data = await window.electron.onDirectoryChosen(path)
    if(data){
      refreshScrollView()
      setImages(data.images);
      loadImageFromDirectory(data.dirPath)
    }
    toggleDropdown()
  }

  const toggleOrganizeView = () => {
    const view = document.querySelector(".organize_panel") as HTMLElement;
    const scrollView = document.querySelector(".image_scroll_view") as HTMLElement;
    if(showOrganizePanel){
      if(!showInfoPanel){
        scrollView.style.marginRight = "0"
      }
      view.style.right = "-376px"
    }else{
      scrollView.style.marginRight = "375px"
      view.style.right = "0"
    }
    showOrganizePanel = !showOrganizePanel
  }

  const closeInfoPanel = () => {
    const infoPanel = document.querySelector(".info_panel") as HTMLElement;
    const scrollView = document.querySelector(".image_scroll_view") as HTMLElement;
    if(!showOrganizePanel){
      scrollView.style.marginRight = "0"
    }
    infoPanel.style.right = "-375px"
    infoPanel.ontransitionend = () => {
      setImageInfo(null)
      infoPanel.ontransitionend = null
    }
    showInfoPanel = false
  }

  const onChapterAction = (isAddingImage: boolean) => setAddType(isAddingImage ? actions.ADD_CHAPTER_IMAGE : actions.ADD_TAG)

  const onChapterSelected = (index: number) => setChapterIndex(index)

  const addImageToChapter = (name: string, path: string) => {
    if(cIndexRef.current !== -1){
      let oldChapter = chaptersRef.current[cIndexRef.current]
      let newChapter: Chapter = { ...oldChapter, images: (oldChapter.images || []).concat([{ name, path }]), modifiedDate: Date.now() }
      saveChapter(newChapter)
    }
  }

  const onViewingChapter = (chapter: Chapter) => {
    setCurrentSource(chapter.name)
    setImageFilter({ ...imageFilter, sortBy: { type: "", asc: true }, extraSettings: { viewByTagOrder: "", withoutSelectedTags: false }})
    setImages(chapter.images || [])
  }

  const toggleFilterPanel = () => {
    const panel = document.querySelector(".filter_panel") as HTMLElement;
    panel.style.transition = "top 0.6s ease-out";
    panel.ontransitionend = () => {
      panel.style.transition = ""
    }
    if(panel.style.top === "0px"){
      panel.style.top = "";
    }else{
      panel.style.top = "0";
    }
  }

  const showProcess = () => {
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
  }

  const updateProcess = (text: string) => {
    const processView = document.querySelector(".processing") as HTMLElement;
    const processText = processView.childNodes[1] as HTMLSpanElement;
    processText.innerText = text
  }

  const hideProcess = (reason?: string) => {
    const processView = document.querySelector(".processing") as HTMLElement;
    const processText = processView.childNodes[1] as HTMLSpanElement;
    if(reason){
      processText.innerText = reason;
      processView.style.backgroundColor = "indigo"
    }else{
      processText.innerText = "Processing (0)";
      processView.style.backgroundColor = ""
      processView.style.display = "none"
    }
    processView.onmouseenter = null
    processView.onmouseleave = null
    processView.onclick = null
  }

  const matchTagWithSDPrompt = async () => {
    if(images.length === 0) return;

    showProcess()
    let newInfos = [...savedInfos]
    let history: UpdateHistoryProps[] = [];
    for(let i = 0; i < images.length; i++){
      if(stopProcess){
        hideProcess(`Process stopped (${i})`)
        stopProcess = false
        return;
      }
      let SDprompt = SDProps.find(prop => prop.ofImage === images[i].path);
      if(SDprompt){
        let matchTags: Tag[] = images[i].tags || [];
        let extractTags: string[] = SDprompt.prompt.split("\n")[0].replace(/<lora:.{1,}>|\(|\)|\[|\]|\b:\d{1}.{0,1}\d{0,}|\B\s/g, "").split(",") || [];
        for(let tag of extractTags){
          let index = tags.findIndex((t: Tag) => tag === t.name);
          if(index !== -1 && !matchTags.some(t => t.name === tags[index].name && t.type === tags[index].type)){
            matchTags.push(tags[index])
          }
        }
        if(matchTags.length > 0){
          let imageIndex = newInfos.findIndex(image => image.path === images[i].path);
          if(imageIndex !== -1){
            newInfos[imageIndex] = { ...newInfos[imageIndex], tags: matchTags, lastModifiedDate: Date.now() }
          }else{
            newInfos.push({ ...images[i], tags: matchTags, lastModifiedDate: Date.now() })
          }
          history.push({ name: images[i].name, path: images[i].path, tags: matchTags, status: "Updated" })
        }
      }
      updateProcess(`Processing (${images.length - i})`)
    }
    setUpdateHistory(updateHistory.concat(history))
    saveImageInfos(newInfos)
    hideProcess()
  }

  const extractTagsFromSD = () => {
    if(images.length === 0) return;

    showProcess()
    let newInfos = [...savedInfos]
    let history: UpdateHistoryProps[] = []
    for(let i = 0; i < images.length; i++){
      if(stopProcess){
        hideProcess(`Process stopped (${i})`)
        return;
      }
      let SDprompt = SDProps.find(prop => prop.ofImage === images[i].path)?.prompt;
      if(SDprompt){
        SDprompt = SDprompt.split("\n")[0];
        let extractTags = SDprompt.replace(/<lora:.{1,}>|\(|\)|\[|\]|\b:\d{1}.{0,1}\d{0,}|\B\s/g, "").replace(/,\s+/g, ",").split(",");
        let filteredTags: Tag[] = images[i].tags || [];
        for(let tag of extractTags){
          //regex left to right: string does not start with white space AND does not include "masterpiece" or "best quality" AND only contain up to 3 white space inbetween
          if(/^((?=\S+)(?=^((?!(masterpiece|best quality)).)*$)(?=^([\S]+\s{0,}[\S]{0,}){0,3}$)).*$/g.test(tag) && !tags.some(t => t.name === tag) && !filteredTags.some(t => t.name === tag)){
            filteredTags.push({ name: tag, type: "common" })
          }
        }
        let imageIndex = newInfos.findIndex(image => image.path === images[i].path)
        if(imageIndex !== -1){
          newInfos[imageIndex].tags = filteredTags
        }else{
          newInfos.push({ ...images[i], tags: filteredTags, lastModifiedDate: Date.now() })
        }
        history.push({ name: images[i].name, path: images[i].path, tags: filteredTags, status: "Updated" })
      }
      updateProcess(`Processing (${images.length - i})`)
    }
    setUpdateHistory(updateHistory.concat(history))
    saveImageInfos(newInfos)
    hideProcess()
  }

  const undoUpdate = () => {
    if(updateHistory.length === 0) return;

    let newImages = [...savedInfos];
    let newHistory = [...updateHistory];
    for(let i = 0; i < updateHistory.length; i++){
      if(updateHistory[i].status === "Updated"){
        let index = newImages.findIndex(image => image.path === updateHistory[i].path);
        if(index !== -1){
          newImages[index] = { ...newImages[index], tags: newImages[index].tags?.filter(t => !updateHistory[i].tags.some(t2 => t.name === t2.name && t.type === t2.type)) }
          newHistory[i] = { ...updateHistory[i], status: "Reverted" }
        }
      }
    }
    saveImageInfos(newImages)
    setUpdateHistory(newHistory)
  }

  const onQuickMatch = () => {
    setModal({ visible: true, message: `Do you want to quick match ${images.length} image(s)?`, onSubmit: matchTagWithSDPrompt })
  }

  const onQuickExtract = () => {
    setModal({ visible: true, message: `Do you want to extract SD prompt from ${images.length} images(s)?`, onSubmit: extractTagsFromSD })
  }

  const onUndoUpdate = () => {
    setModal({ visible: true, message: `Do you want to undo ${updateHistory.length} update(s)?`, onSubmit: undoUpdate })
  }

  const clearHistory = () => setUpdateHistory([])

  const deleteSource = (index: number) => () => {
    let newSources = paths.filter((p, i) => i !== index)
    setPaths(newSources)
    store.set("savedPaths", JSON.stringify(newSources))
  }

  const refreshScrollView = () => {
    const scrollView = document.querySelector(".image_scroll_view") as HTMLElement;
    scrollView.scrollTop = 0
  }

  const clearSource = (e: React.MouseEvent) => {
    setImages([]);
    setCurrentSource("");
  }

  const updateAllTagInstances = (tag: Tag) => {
    setTagModal({ ...tagModal, visible: false })
    let newImages: ImageInfo[] = [...savedInfos];
    for(let i = 0; i < newImages.length; i++){
      let index = newImages[i].tags?.findIndex(t => t.name === tagModal.initialTag.name && t.type === tagModal.initialTag.type)
      if(index !== -1){
        newImages[i].tags[index] = tag
      }
    }
    saveImageInfos(newImages)
  }

  const removeAllTagInstances = () => {
    setTagModal({ ...tagModal, visible: false })
    let newImages = [...savedInfos]
    for(let i = 0; i < newImages.length; i++){
      newImages[i].tags = newImages[i].tags?.filter(t => t.name !== tagModal.initialTag.name || t.type !== tagModal.initialTag.type);
    }
    saveImageInfos(newImages)
  }

  const onUpdatingAllTags = (tag: UniqueTag, type: string) => setTagModal({ visible: true, type: type, initialTag: tag })

  const onSubmitUpdateAllTags = (tag: Tag) => {
    if(tagModal.type === "update"){
      updateAllTagInstances(tag)
    }else{
      removeAllTagInstances()
    }
  }

  const onCancelUpdateTag = () => setTagModal({ ...tagModal, visible: false })

  const toggleTab = () => setSwitchTab(!switchTabRef.current)

  const getHighlightImages: () => HighlightImage[] = () => {
    let images: HighlightImage[] = []
    if(imageInfo){
      images.push({ ...imageInfo, highlightType: 1 })
    }
    if(chapters[cIndex]?.images){
      images = images.concat(chapters[cIndex].images?.map(c => ({...c, highlightType: 2})) as HighlightImage[])
    }
    return images
  }

  return (
    <div style={{
      background: `linear-gradient(200deg,
        ${colorGradients[appSettings.colorScheme].top} -30%,
        ${colorGradients[appSettings.colorScheme].middle} 48%,
        ${colorGradients[appSettings.colorScheme].bottom} 130%)`
      }}
      className="content">
      <ImageViewer onBackropClicked={onBackropClicked}/>
      {
        fileLoaded &&
        <>
          <div className="status_bar">
            <div className="connection_status">
              <span style={{ color: isWebUIOpened ? "rgb(122, 245, 122)" : "red"}}>{isWebUIOpened ? "Connected" : "SD WebUI closed"}</span>
              <span style={{ backgroundColor: isWebUIOpened ? "rgb(122, 245, 122)" : "red"}} className="connection_status_dot"></span>
            </div>
            <div className="divider" />
            <div className="folder_source">
              <div className={currentSource.length > 0 ? "active_source" : ""}>
                <span onClick={toggleDropdown}>{currentSource || "Choose a source..."}</span>
                <FiDelete className='clear_source' onClick={clearSource}/>
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
            <span className="transfer transparent_button">
              <div className="background" onClick={() => setTransferModal(true)}/>
              Transfer
            </span>
            <span style={{ backgroundColor: imageFilter.selectedTags.length > 0 ? "yellowgreen" : "transparent" }} className='filter transparent_button' onClick={toggleFilterPanel}>
              <div className="background"></div>
              Filter
            </span>
            <span className="organize transparent_button" onClick={toggleOrganizeView}>
              <div className="background" />
              Organize
            </span>
          </div>
          <div className="img_container" onClick={onBlur}>
            <ImageScrollView
              highlightImages={getHighlightImages()}
              images={images}
              source={currentSource}
              onImageClicked={toFullScreen}
              onImageContextMenu={onImageContextMenu}
              onImageMouseEnter={onImageMouseEnter}
              onImageMouseLeave={onImageMouseLeave}
              onInfoIconClicked={showImageInfo}
            />
            <OrganizePanel
              tags={tags}
              chapter={chapters[cIndex]}
              updateHistory={updateHistory}
              currentSource={currentSource}
              addType={addType}
              onTagListChanged={setTags}
              onChapterSelected={onChapterSelected}
              onChapterAction={onChapterAction}
              onViewingChapter={onViewingChapter}
              onQuickMatch={onQuickMatch}
              onQuickExtract={onQuickExtract}
              onUndoUpdate={onUndoUpdate}
              clearHistory={clearHistory}
            />
            <InfoPanel info={imageInfo} onPanelClosed={closeInfoPanel} onImageChanged={setImageInfo}/>
            <ImagePreview/>
          </div>
          <MessageModal/>
          <UpdateTagModal {...tagModal} onSubmit={onSubmitUpdateAllTags} onCancel={onCancelUpdateTag} />
          <LinkTransferModal visible={transferModal} onDismiss={() => setTransferModal(false)}/>
          <FilterPanel currentSource={currentSource} imageInfos={images} onUpdatingAllTags={onUpdatingAllTags}/>
          <SDWebUI visible={switchTab} setWebUIOpened={setWebUIOpened}/>
          {
            isWebUIOpened &&
            <div className="switch_page" onClick={toggleTab}>
              { switchTab ? <MdOutlineSwitchLeft/> : <MdOutlineSwitchRight/>}
            </div>
          }
          <ExtraSettings/>
        </>
      }
    </div>
  );
}

export default function App() {
  const [modal, setModal] = useState<ModalProps>({ visible: false, message: "" })
  const [savedInfos, saveImageInfos] = useImageInfos()
  const [imageFilter, setImageFilter] = useImageFilter()
  const [appSettings, saveAppSettings] = useAppSettings()
  const [chapters, saveChapter] = useChapters()
  const [SDProps, setSDProps] = useState<SDProps[]>([])

  return (
    <AppContext.Provider value={{ savedInfos, saveImageInfos, imageFilter, setImageFilter, appSettings, saveAppSettings, chapters, saveChapter, SDProps, setSDProps }}>
      <ModalContext.Provider value={{ modal, setModal }}>
        <Hello />
      </ModalContext.Provider>
    </AppContext.Provider>
  );
}
