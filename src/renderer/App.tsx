import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import { FcOpenedFolder } from 'react-icons/fc';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { BiSolidChevronDown } from 'react-icons/bi';
import MessageModal from './components/MessageModal';
import ImageViewer from './components/ImageViewer';
import UpdateHistory from './components/UpdateHistory';
import { Chapter, ImageInfo, Tag, UpdateHistoryProps } from './constant/types';
import ChapterView from './components/ChapterView';
import InfoPanel from './components/InfoPanel';
import { IoInformationCircleOutline } from 'react-icons/io5'
import OrganizePanel from './components/OrganizePanel';

// todo unload images -2/+2 page using intersect observer

const getAverageRGB = (imgEl: HTMLImageElement) => {
  const blockSize = 5; // only visit every 5 pixels
  const defaultRGB = { r: 0, g: 0, b: 0 }; // for non-supporting envs
  const canvas = document.createElement('canvas');
  const context = canvas.getContext && canvas.getContext('2d');
  let data;
  let width;
  let height;
  let i = -4;
  let length;
  const rgb = { r: 0, g: 0, b: 0 };
  let count = 0;

  if (!context) {
    return defaultRGB;
  }

  height = canvas.height =
    imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
  width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

  context.drawImage(imgEl, 0, 0);

  data = context.getImageData(0, 0, width, height);

  length = data.data.length;

  while ((i += blockSize * 4) < length) {
    ++count;
    rgb.r += data.data[i];
    rgb.g += data.data[i + 1];
    rgb.b += data.data[i + 2];
  }

  // ~~ used to floor values
  rgb.r = ~~(rgb.r / count);
  rgb.g = ~~(rgb.g / count);
  rgb.b = ~~(rgb.b / count);

  return rgb;
};

const maxImageLoad = 30;
let toColumn = 1;
let isViewingFullScreen = false;
let isLoadingNextPage = false;
let viewIndex = 0;
let showDropDown = false;
let folderIndex = -1;
let showOrganizePanel = false;
let showInfoPanel = false;
let isQuickAdding = false;
let prevUpdatedImage = "";

function Hello() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [page, setPage] = useState(1);
  const [paths, setPaths] = useState([]);
  const [messageModal, setMessageModal] = useState({ visible: false, message: "" })
  const [updateHistory, setUpdateHistory] = useState<UpdateHistoryProps[]>([])
  const [imageInfo, setImageInfo] = useState<ImageInfo>({ name: "", path: "" })
  const [tags, setTags] = useState<Tag[]>([]);
  const [chapter, setChapter] = useState<Chapter>({ name: "", images: [], createDate: 0, modifiedDate: 0 })
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [actionType, setActionType] = useState<string>("addTag")
  const pageRef = useRef<number>(0);
  const imagesRef = useRef<any>();
  const pathsRef = useRef<any>([]);
  const imageInfoRef = useRef<ImageInfo>(imageInfo);
  const tagsRef = useRef<Tag[]>([]);
  const updateHistoryRef = useRef<UpdateHistoryProps[]>([]);
  const actionTypeRef = useRef<string>("");
  const chapterRef = useRef<Chapter>();
  const chaptersRef = useRef<Chapter[]>([]);

  pageRef.current = page;
  imagesRef.current = images;
  pathsRef.current = paths;
  imageInfoRef.current = imageInfo;
  tagsRef.current = tags;
  updateHistoryRef.current = updateHistory;
  actionTypeRef.current = actionType;
  chapterRef.current = chapter;
  chaptersRef.current = chapters;

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
        image.src = `http://localhost:4000/image/${imagesRef.current[viewIndex].name}`;
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

  const refreshScrollView = (dirPath: string) => {
    const columns = document.querySelectorAll('.column');
    for (const column of columns) {
      (column as HTMLElement).innerHTML = '';
    }
    (document.querySelector('.folder_source>span') as HTMLSpanElement).innerText = dirPath;
  }

  const loadImageFromDirectory = async (dirPath: string, images: ImageInfo[]) => {
    if (dirPath) {
      toColumn = 1
      saveDirPath(dirPath);
      refreshScrollView(dirPath);
      const scrollView = document.querySelector('.scroll_view') as HTMLElement;
      const res = await fetch('http://localhost:4000/streamImage', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Allow-Control-Access-Origin': '*',
        },
        body: JSON.stringify({ dirURL: dirPath }),
      });
      const status = await res.json();
      if (status) {
        appendImagesToUI(images.slice(0, maxImageLoad));
        if (maxImageLoad < images.length) {
          scrollView.onscroll = () => {
            if (
              scrollView.clientHeight + scrollView.scrollTop >=
                scrollView.scrollHeight &&
              !isLoadingNextPage
            ) {
              isLoadingNextPage = true;
              appendImagesToUI(
                images.slice(
                  maxImageLoad * pageRef.current,
                  maxImageLoad * (pageRef.current + 1)
                )
              );
              setPage(pageRef.current + 1);
            }
          };
        }
      }
    }
  };

  const openDirectory = async () => {
    const data = await window.electron.chooseDirectory(maxImageLoad);
    if(data){
      setImages(data);
      loadImageFromDirectory(data.dirPath, data.images)
    }
  }

  const appendImagesToUI = (images: ImageInfo[]) => {
    for (const image of images) {
      const imagePath = image.path;
      const imgCard = document.createElement('div');
      const imgCardContent = document.createElement('div');
      const imgTag = document.createElement('img');
      const imgAvgColor = document.createElement('div');
      const imgPreload = document.createElement('div');
      const infoIcon = document.createElement('div');
      imgCard.className = 'img_card';
      imgCardContent.className = 'img_card_content'
      imgTag.className = 'image';
      imgPreload.className = 'image_preload';
      imgAvgColor.className = 'img_avg_color';
      infoIcon.className = 'info_icon';
      infoIcon.innerText = "i";
      imgTag.src = `http://localhost:4000/${image.path.substring(3).replace(/\\/g, "/").replace(/ /g, "_")}`;
      imgTag.crossOrigin = 'Anonymous';
      imgTag.draggable = false;
      imgCard.dataset.path = imagePath;
      imgCard.appendChild(imgCardContent);
      imgCardContent.appendChild(imgPreload);
      imgCardContent.appendChild(infoIcon);
      const column = document.querySelector(
        `.column:nth-child(${toColumn})`
      ) as HTMLElement;
      column.appendChild(imgCard);
      toColumn = toColumn === 5 ? 1 : toColumn + 1;
      imgTag.onload = () => {
        const rgb = getAverageRGB(imgTag);
        imgAvgColor.style.backgroundColor = `rgb(${rgb.r},${rgb.g}, ${rgb.b})`;
        imgCardContent.removeChild(imgPreload);
        imgCardContent.appendChild(imgAvgColor);
        imgCardContent.appendChild(imgTag);
        if (
          images.findIndex((img) => img.name === image.name) ===
          images.length - 1
        ) {
          isLoadingNextPage = false;
        }
        imgTag.onclick = (e: MouseEvent) =>
          toFullScreen(
            e,
            imgTag.naturalWidth,
            imgTag.naturalHeight,
            images.findIndex((img) => img.name === image.name)
          );
        imgTag.oncontextmenu = (e: MouseEvent) => {
          if(actionTypeRef.current === "addTag"){
            addTagToImage(image.name, imagePath, image.type, image.createdDate)
          }else{
            addImageToChapter(image.name, imagePath)
          }
        }
        imgCard.onmouseenter = (e: MouseEvent) => {
          if(!isQuickAdding){
            infoIcon.style.right = "5px"
            infoIcon.style.rotate = "0deg"
          }else{
            if(actionTypeRef.current === "addTag"){
              addTagToImage(image.name, imagePath, image.type, image.createdDate)
            }else{
              addImageToChapter(image.name, imagePath)
            }
          }
        }
        imgCard.onmouseleave = (e: MouseEvent) => {
          if(!isQuickAdding){
            infoIcon.style.right = "-20px"
            infoIcon.style.rotate = "75deg"
          }
          if(prevUpdatedImage === image.name){
            prevUpdatedImage = ""
          }
        }
        infoIcon.onclick = (e: MouseEvent) => showImageInfo(e, { ...image, path: imagePath, width: imgTag.naturalWidth, height: imgTag.naturalHeight })
      };
    }
  };

  const showImageInfo = (e: MouseEvent, imageInfo: ImageInfo) => {
    if(imageInfo.name === (document.querySelector(".info_name") as HTMLElement).innerText){
      return;
    }
    const rawJSON = localStorage.getItem("imageInfos");
    let infos: ImageInfo[] = []
    if(rawJSON){
      infos = JSON.parse(rawJSON)
    }
    let savedInfo = infos.find(i => i.path === imageInfo.path) || {};
    setImageInfo({ ...imageInfo, ...savedInfo });
    const infoPanel = document.querySelector(".info_panel") as HTMLElement;
    const scrollView = document.querySelector(".scroll_view") as HTMLElement;
    if(!showInfoPanel){
      scrollView.style.transition = "margin-right 0.3s ease-out"
      scrollView.style.marginRight = `${infoPanel.clientWidth}px`
      infoPanel.style.transition = "top 0.4s ease-out 0.3s"
      infoPanel.style.top = "0"
    }
    showInfoPanel = true
  }

  const toFullScreen = (
    e: MouseEvent,
    width: number,
    height: number,
    index: number
  ) => {
    if (isViewingFullScreen) return;
    isViewingFullScreen = true;
    viewIndex = index;
    (document.querySelector(".viewer_image") as HTMLImageElement).src = ""
    const image = e.target as HTMLImageElement;
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
      height / image.clientHeight
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
    };
  };

  const addTagToImage = (name: string, path: string, type: string | undefined, createdDate: number | undefined) => {
    if(actionTypeRef.current !== "addTag" || prevUpdatedImage === name) return;

    if(tagsRef.current.length > 0){
      prevUpdatedImage = name;
      const rawJSON = localStorage.getItem("imageInfos");
      let infos: ImageInfo[] = [];
      if(rawJSON){
        infos = JSON.parse(rawJSON)
      }
      const index = infos.findIndex(i => i.path === path);
      if(index !== -1){
        infos[index] = {
          path: path,
          name: name,
          type: type,
          tags: infos[index].tags?.filter(t => !tagsRef.current.find(t2 => t.name === t2.name && t.type === t2.type)).concat(tagsRef.current),
          createdDate: createdDate,
          lastModifiedDate: Date.now()
        }
      }else{
        infos.push({ name, path, type, tags: tagsRef.current, createdDate, lastModifiedDate: Date.now() })
      }
      localStorage.setItem("imageInfos", JSON.stringify(infos))
      setUpdateHistory(updateHistoryRef.current.concat({ name, path, tags }))
    }else{
      setMessageModal({ visible: true, message: "Oops! No tag to add..." })
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
  }

  const toggleOrganizeView = () => {
    const view = document.querySelector(".organize_view") as HTMLElement;
    const scrollView = document.querySelector(".scroll_view") as HTMLElement
    if(showOrganizePanel){
      if(!showInfoPanel){
        scrollView.style.transition = "margin-right 0.4s ease-out 0.3s"
        scrollView.style.marginRight = "0"
      }
      view.style.transition = "top 0.3s ease-out"
      view.style.top = "100%"
    }else{
      scrollView.style.transition = "margin-right 0.3s ease-out"
      scrollView.style.marginRight = `${view.clientWidth}px`
      view.style.transition = "top 0.4s ease-out 0.3s"
      view.style.top = "0"
    }
    showOrganizePanel = !showOrganizePanel
  }

  const closeInfoPanel = () => {
    const infoPanel = document.querySelector(".info_panel") as HTMLElement;
    const scrollView = document.querySelector(".scroll_view") as HTMLElement;
    if(!showOrganizePanel){
      scrollView.style.transition = "margin-right 0.4s ease-out 0.3s"
      scrollView.style.marginRight = "0"
    }
    infoPanel.style.transition = "top 0.3s ease-out"
    infoPanel.style.top = "100%"
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
        setMessageModal({ visible: true, message: "Chapter existed" })
        return;
      }
      if(chapterName.length >= 3 && chapterName.length <= 40){
        savedChapters.push({ name: chapterName, images: [], createDate: Date.now(), modifiedDate: Date.now() });
        setChapters(savedChapters);
        localStorage.setItem("chapters", JSON.stringify(savedChapters));
      }else{
        setMessageModal({ visible: true, message: "Chapter name must be longer than 2 characters" })
      }
    }
  }

  const onChapterAction = (isAddingImage: boolean) => setActionType(isAddingImage ? "addChapterImage" : "addTag")

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
    const rawJSON = localStorage.getItem("imageInfos");
    let infos: ImageInfo[] = [];
    if(rawJSON){
      infos = JSON.parse(rawJSON)
    }
    let images = chapter.images || [];
    if(images.length > 0){
      refreshScrollView(chapter.name)
      images = images.map(i => ({ ...i, ...(infos.find(i2 => i.name === i2.name && i.path === i2.path) || {})}));
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
        toColumn = 1
        setImages(images)
        setPage(1)
        appendImagesToUI(images)
      }
    }else{
      setImages([])
    }
  }

  const onDeletingChapterImage = (imageIndex: number) => {
    let newChapter: Chapter = { ...chapter, images: chapter?.images?.slice(0, imageIndex).concat(chapter.images.slice(imageIndex+1)), modifiedDate: Date.now() }
    let newChapters = chapters.map(c => c.name === newChapter.name ? newChapter : c);
    localStorage.setItem("chapters", JSON.stringify(newChapters));
    setChapter(newChapter)
    setChapters(newChapters)
    onViewingChapter(newChapter)
  }

  return (
    <div className="content">
      <div className="status_bar">
        <span className="connection_status">Connected</span>
        <div className="divider" />
        <div className="folder_source" onClick={toggleDropdown}>
          <span>Choose a source...</span>
          <BiSolidChevronDown className="dropdown_icon" />
          <div className="folder_source_dropdown">
            <ul>
              {paths.map((path: string) => (
                <li onClick={onDropdownItemClicked(path)}>{path}</li>
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
        <span className='filter'>
          <div className="background"></div>
          Filter
        </span>
        <span className="organize" onClick={toggleOrganizeView}>
          <div className="background" />
          Organize
        </span>
      </div>
      <div className="img_container" onClick={onBlur}>
        <div className="scroll_view">
          <div className="column" />
          <div className="column" />
          <div className="column" />
          <div className="column" />
          <div className="column" />
        </div>
        <OrganizePanel
          tags={tags}
          chapter={chapter}
          chapters={chapters}
          actionType={actionType}
          updateHistory={updateHistory}
          onTagListChanged={setTags}
          onChapterInput={createChapter}
          onChapterSelected={onChapterSelected}
          onChapterAction={onChapterAction}
          onViewingChapter={onViewingChapter}
          onDeletingChapterImage={onDeletingChapterImage}
        />
        <InfoPanel info={imageInfo} onPanelClosed={closeInfoPanel}/>
      </div>
      <ImageViewer/>
      <MessageModal
        visible={messageModal.visible}
        message={messageModal.message}
        onBackdropClicked={() => setMessageModal({...messageModal, visible: false })}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
