import React, { useEffect, useState, useRef, useContext } from 'react';
import './App.css';
import { FcOpenedFolder } from 'react-icons/fc';
import { BiSolidChevronDown } from 'react-icons/bi';
import MessageModal from './components/MessageModal';
import MediaViewer from './components/MediaViewer';
import {
  Chapter,
  HighlightMedia,
  MediaInfo,
  ModalProps,
  SDProps,
  Tag,
  UniqueTag,
  UpdateHistoryProps,
  actions,
  colorGradients,
  initFilter,
  maxMediaLoad,
} from './constant/types';
import InfoPanel from './components/InfoPanel';
import OrganizePanel from './components/OrganizePanel';
import FilterPanel from './components/FilterPanel';
import { AppContext, ModalContext } from './constant/context';
import {
  useAppSettings,
  useChapters,
  useMediaFilter,
  useMediaInfos,
} from './constant/hooks';
import MediaScrollView from './components/MediaScrollView';
import store from './constant/store';
import { FiDelete } from 'react-icons/fi';
import UpdateTagModal from './components/UpdateTagModal';
import { MdOutlineSwitchLeft, MdOutlineSwitchRight } from 'react-icons/md';
import ExtraSettings from './components/ExtraSettings';
import MediaPreview from './components/MediaPreview';
import LinkTransferModal from './components/LinkTransferModal';
import { createWorkerFactory, useWorker } from '@shopify/react-web-worker';

const createWorker = createWorkerFactory(
  () => import('./workerFiles/loadSDPrompt')
);

let isFullScreen = false;
let isViewingMedia = false;
let viewIndex = 0;
let showDropDown = false;
let folderIndex = -1;
let showOrganizePanel = true;
let showInfoPanel = false;
let isQuickAdding = false;
let prevUpdatedMedia = '';
let stopProcess = false;

function Hello() {
  const [fileLoaded, setFileLoaded] = useState(false);
  const [medias, setMedias] = useState<MediaInfo[]>([]);
  const [paths, setPaths] = useState([]);
  const { modal, setModal } = useContext(ModalContext);
  const [tagModal, setTagModal] = useState({
    visible: false,
    type: 'update',
    initialTag: { name: '', type: 'common', numberOfOccurence: 0 },
  });
  const [transferModal, setTransferModal] = useState(false);
  const [updateHistory, setUpdateHistory] = useState<UpdateHistoryProps[]>([]);
  const [imageInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [cIndex, setChapterIndex] = useState<number>(-1);
  const [addType, setAddType] = useState<string>(actions.ADD_TAG);
  const [currentSource, setCurrentSource] = useState('');
  const [wifiIP, setWifiIP] = useState('');
  const [mediaViewerSource, setMediaViewerSource] = useState('');
  const {
    savedInfos,
    saveMediaInfos,
    mediaFilter,
    setMediaFilter,
    appSettings,
    chapters,
    saveChapter,
    SDProps,
    setSDProps,
  } = useContext(AppContext);
  const mediasRef = useRef<any>();
  const pathsRef = useRef<any>([]);
  const imageInfoRef = useRef<MediaInfo | null>();
  const tagsRef = useRef<Tag[]>([]);
  const updateHistoryRef = useRef<UpdateHistoryProps[]>([]);
  const addTypeRef = useRef<string>();
  const cIndexRef = useRef<number>(-1);
  const chaptersRef = useRef<Chapter[]>([]);
  const modalRef = useRef<ModalProps>();
  const currentSourceRef = useRef('');
  const worker = useWorker(createWorker);

  mediasRef.current = medias;
  pathsRef.current = paths;
  imageInfoRef.current = imageInfo;
  tagsRef.current = tags;
  updateHistoryRef.current = updateHistory;
  addTypeRef.current = addType;
  cIndexRef.current = cIndex;
  chaptersRef.current = chapters;
  modalRef.current = modal;
  currentSourceRef.current = currentSource;

  const loadDirectoryPaths = async () => {
    const rawJSON = (await store.get('savedPaths')) as string;
    if (rawJSON) {
      setPaths(JSON.parse(rawJSON));
    }
  };

  const requestAssociatedFile = async () => {
    const imagePath: string = await window.electron.requestAssociatedFile();
    if (imagePath) {
      isViewingMedia = true;
      const modal = document.querySelector('.media_viewer') as HTMLElement;
      const mediaView = document.querySelector(
        '.viewer_media'
      ) as HTMLMediaElement;
      mediaView.src = imagePath;
      modal.style.zIndex = '5';
      modal.style.opacity = '1';
      mediaView.style.opacity = '1';
      mediaView.onload = () => {
        modal.ontransitionend = async () => {
          const source = imagePath.substring(0, imagePath.lastIndexOf('\\'));
          const data = await window.electron.onDirectoryChosen(source);
          setCurrentSource(source);
          if (Array.isArray(data.medias)) {
            setMedias(data.medias);
            setFileLoaded(true);
            viewIndex = data.medias.findIndex(
              (media: MediaInfo) => media.path === imagePath
            );
          }
          modal.ontransitionend = null;
        };
        mediaView.onload = null;
      };
    } else {
      setFileLoaded(true);
    }
  };

  useEffect(() => {
    // saveMediaInfos([])
    requestAssociatedFile();
    window.onkeydown = async (e: KeyboardEvent) => {
      if (e.code === 'F1') {
        toggleOrganizeView();
        e.preventDefault();
      }
      if (e.code === 'F2') {
        toggleFilterPanel();
        e.preventDefault();
      }
      if (e.code === 'Escape' && modalRef.current?.visible) {
        setModal({ ...modalRef.current, visible: false });
      }
      if (e.code.includes('Control') && !isQuickAdding) {
        isQuickAdding = true;
        for (let record of updateHistoryRef.current) {
          const card = document.querySelector(
            `.image_card[data-path="${record.path.replace(/\\/g, '\\\\')}"]`
          ) as HTMLElement;
          if (card) {
            card.className = 'image_card image_card_highlight';
          }
        }
      }
      if (
        pathsRef.current.length > 0 &&
        (e.code === 'ArrowDown' || e.code === 'ArrowUp')
      ) {
        if (e.code === 'ArrowDown') {
          folderIndex =
            folderIndex === pathsRef.current.length - 1 ? 0 : folderIndex + 1;
        } else {
          folderIndex =
            folderIndex < 1 ? pathsRef.current.length - 1 : folderIndex - 1;
        }
        const data = await window.electron.onDirectoryChosen(
          pathsRef.current[folderIndex]
        );
        if (data) {
          setMedias(data.images);
          loadMediasFromDirectory(data.dirPath);
        }
        e.preventDefault();
      }
      if (
        isViewingMedia &&
        (e.code === 'ArrowLeft' || e.code === 'ArrowRight')
      ) {
        if (e.code === 'ArrowLeft') {
          viewIndex =
            viewIndex === 0 ? mediasRef.current.length - 1 : viewIndex - 1;
        }
        if (e.code === 'ArrowRight') {
          viewIndex =
            viewIndex === mediasRef.current.length - 1 ? 1 : viewIndex + 1;
        }
        setMediaViewerSource(mediasRef.current[viewIndex].path);
        removeOverlap();
      }
    };
    window.onkeyup = (e: KeyboardEvent) => {
      if (e.code.includes('Control') && isQuickAdding) {
        isQuickAdding = false;
        for (let record of updateHistoryRef.current) {
          const card = document.querySelector(
            `.image_card[data-path="${record.path.replace(/\\/g, '\\\\')}"]`
          ) as HTMLElement;
          if (card) {
            card.className = 'image_card';
          }
        }
      }
    };
    window.electron.getWifiIP((e: any, ip: string) => {
      setWifiIP(ip);
    });
    loadDirectoryPaths();
  }, []);

  useEffect(() => {
    loadSDPrompt();
  }, [medias]);

  useEffect(() => {
    loadMediaWithoutSource();
    if (fileLoaded) {
      store.set('mediaFilter', JSON.stringify(mediaFilter));
    }
  }, [mediaFilter]);

  const loadMediaWithoutSource = () => {
    if (currentSource.length === 0 && mediaFilter.selectedTags.length > 0) {
      setMedias(
        savedInfos.filter((i) =>
          i.tags?.find((t) =>
            mediaFilter.selectedTags.some(
              (t2) => t.name === t2.name && t.type === t2.type
            )
          )
        )
      );
    }
  };

  const onBackdropClicked = (e: React.MouseEvent) => {
    const modal = e.target as HTMLElement;
    const mediaOverlap = document.querySelector(
      '.media_overlap'
    ) as HTMLElement;
    modal.style.opacity = '0';
    if (mediaOverlap) mediaOverlap.style.opacity = '0';
    setTimeout(() => {
      modal.style.zIndex = '-1';
      if (mediaOverlap) mediaOverlap.remove();
      isViewingMedia = false;
    }, 450);
  };

  const removeOverlap = () => {
    const overlap = document.querySelector('.media_overlap') as HTMLElement;
    if (overlap) {
      overlap.remove();
    }
  };

  const loadMediasFromDirectory = (dirPath: string) => {
    if (dirPath) {
      refreshScrollView();
      saveDirPath(dirPath);
      setCurrentSource(dirPath);
    }
  };

  const openDirectoryPicker = async () => {
    const data = await window.electron.chooseDirectory(maxMediaLoad);
    console.log('data from chooseDirectory', data);
    if (data) {
      refreshScrollView();
      setMedias(data.medias);
      loadMediasFromDirectory(data.dirPath);
    }
  };

  const loadSDPrompt = async () => {
    let loadFor = currentSource;
    let SDProps: SDProps[] = [];
    for (let i = 0; i < medias.length; i++) {
      if (loadFor !== currentSourceRef.current) return;
      let prop = await worker.loadSDPrompt(medias[i]);
      if (prop) {
        const attr = JSON.parse(prop.prompt);
        for (const key of Object.keys(attr)) {
          if (
            attr[key].class_type === 'CLIPTextEncode' &&
            (attr[key].inputs.text.includes('1girl') ||
              attr[key].inputs.text.includes('masterpiece') ||
              attr[key].inputs.text.includes('best quality'))
          ) {
            SDProps.push({
              ofMedia: medias[i].path,
              prompt: attr[key].inputs.text,
            });
          }
        }
      }
    }
    setSDProps(SDProps);
    return null;
  };

  const showMediaInfo = (info: MediaInfo) => {
    if (
      info.name === imageInfo?.name &&
      info.path === imageInfo?.path &&
      showInfoPanel
    ) {
      return;
    }
    const savedInfo = savedInfos.find((i) => i.path === info.path);
    setMediaInfo({
      ...info,
      ...savedInfo,
      chapters: chaptersRef.current
        .filter((c: Chapter) => c.medias?.some((m) => m.path === info.path))
        .map((c: Chapter) => c.name),
    });
    const infoPanel = document.querySelector('.info_panel') as HTMLElement;
    const scrollView = document.querySelector(
      '.media_scroll_view'
    ) as HTMLElement;
    if (!showInfoPanel) {
      scrollView.style.marginRight = '375px';
      infoPanel.style.right = '0';
    }
    showInfoPanel = true;
  };

  const toFullScreen = (
    e: React.MouseEvent,
    index: number,
    isVideo: boolean = false
  ) => {
    if (isViewingMedia) return;
    isViewingMedia = true;
    viewIndex = index;
    (document.querySelector('.viewer_media') as HTMLImageElement).src = '';
    let media: HTMLImageElement | HTMLVideoElement;
    let naturalHeight: number = 1536;
    let mediaOverlap: HTMLImageElement | HTMLVideoElement;
    if (isVideo) {
      media = e.target as HTMLVideoElement;
      mediaOverlap = document.createElement('video');
      mediaOverlap.muted = true;
      mediaOverlap.loop = true;
      mediaOverlap.autoplay = true;
    } else {
      media = e.target as HTMLImageElement;
      naturalHeight = media.naturalHeight;
      mediaOverlap = document.createElement('img');
    }
    const container = document.querySelector('.content') as HTMLElement;
    const bounds = media.getBoundingClientRect();
    mediaOverlap.className = 'media_overlap';
    mediaOverlap.style.width = `${media.clientWidth}px`;
    mediaOverlap.style.left = '0';
    mediaOverlap.style.top = '0';
    mediaOverlap.style.transform = `translate(${bounds.x}px, ${bounds.y}px)`;
    mediaOverlap.src = media.src;
    mediaOverlap.draggable = false;
    const scaleFactor = Math.min(
      (window.innerHeight * 0.95) / media.clientHeight,
      naturalHeight / media.clientHeight
    );
    mediaOverlap.addEventListener(isVideo ? 'loadeddata' : 'load', () => {
      container.appendChild(mediaOverlap);
      mediaOverlap.style.transform = `scale(${scaleFactor})  translate(calc((50vw - ${
        media.clientWidth / 2
      }px)/${scaleFactor}), calc((50vh - ${
        media.clientHeight / 2
      }px)/${scaleFactor}))`;
      mediaOverlap.style.zIndex = '10';
      const modal = document.querySelector('.media_viewer') as HTMLElement;
      modal.style.zIndex = '5';
      modal.style.opacity = '1';
    });
  };

  const onMediaContextMenu = (media: MediaInfo) => {
    if (addTypeRef.current === actions.ADD_TAG) {
      addTagToMedia(media.name, media.path, media.type, media.createdDate);
    } else {
      addMediaToChapter(media.name, media.path);
    }
  };

  const onMediaMouseEnter = (e: React.MouseEvent, media: MediaInfo) => {
    const infoIcon = (e.target as HTMLElement).parentElement?.querySelector(
      '.info_icon'
    ) as HTMLElement;
    if (!isQuickAdding) {
      if (infoIcon) {
        infoIcon.style.right = '5px';
        infoIcon.style.rotate = '0deg';
      }
    } else {
      if (addTypeRef.current === actions.ADD_TAG) {
        addTagToMedia(media.name, media.path, media.type, media.createdDate);
      } else {
        addMediaToChapter(media.name, media.path);
      }
    }
  };

  const onMediaMouseLeave = (e: React.MouseEvent, media: MediaInfo) => {
    const infoIcon = (e.target as HTMLElement).parentElement?.querySelector(
      '.info_icon'
    ) as HTMLElement;
    if (!isQuickAdding && infoIcon) {
      infoIcon.style.right = '-20px';
      infoIcon.style.rotate = '75deg';
    }
    if (prevUpdatedMedia === media.name) {
      prevUpdatedMedia = '';
    }
  };

  const addTagToMedia = (
    name: string,
    path: string,
    type: string | undefined,
    createdDate: number | undefined
  ) => {
    if (addTypeRef.current !== actions.ADD_TAG || prevUpdatedMedia === name)
      return;

    if (tagsRef.current.length > 0) {
      prevUpdatedMedia = name;
      let newInfos = [...savedInfos];
      const index = newInfos.findIndex((i) => i.path === path);
      if (index !== -1) {
        newInfos[index] = {
          path: path,
          name: name,
          type: type,
          tags: newInfos[index].tags
            ?.filter(
              (t) =>
                !tagsRef.current.find(
                  (t2) => t.name === t2.name && t.type === t2.type
                )
            )
            .concat(tagsRef.current),
          createdDate: createdDate,
          lastModifiedDate: Date.now(),
        };
      } else {
        newInfos.push({
          name,
          path,
          type,
          tags: tagsRef.current,
          createdDate,
          lastModifiedDate: Date.now(),
        });
      }
      saveMediaInfos(newInfos);
      setUpdateHistory(
        updateHistoryRef.current.concat({ name, path, tags, status: 'Updated' })
      );

      if (isQuickAdding) {
        (document.querySelector(
          `.image_card[data-path="${path.replace(/\\/g, '\\\\')}"]`
        ) as HTMLElement)!.className = 'image_card image_card_highlight';
      }
    }
  };

  const saveDirPath = async (path: string) => {
    const rawJSON = (await store.get('savedPaths')) as string;
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
    const dropdown = document.querySelector(
      '.folder_source_dropdown'
    ) as HTMLElement;
    if (showDropDown) {
      dropdown.style.top = '25';
      dropdown.style.opacity = '0';
      setTimeout(() => {
        dropdown.style.display = 'none';
      }, 400);
    } else {
      dropdown.style.display = 'block';
      setTimeout(() => {
        dropdown.style.top = '25';
        dropdown.style.opacity = '1';
      }, 10);
    }
    showDropDown = !showDropDown;
  };

  const onBlur = () => {
    const dropdown = document.querySelector(
      '.folder_source_dropdown'
    ) as HTMLElement;
    const chapterMenu = document.querySelector('.chapter_menu') as HTMLElement;
    const mediaPreview = document.querySelector(
      '.media_preview'
    ) as HTMLElement;
    dropdown.style.top = '25';
    dropdown.style.opacity = '0';
    setTimeout(() => {
      dropdown.style.display = 'none';
    }, 400);
    showDropDown = false;
    chapterMenu.style.display = 'none';
    mediaPreview.style.opacity = '0';
    mediaPreview.style.zIndex = '-1';
  };

  const onDropdownItemClicked =
    (path: string) => async (e: React.MouseEvent) => {
      const data = await window.electron.onDirectoryChosen(path);
      if (data) {
        refreshScrollView();
        setMedias(data.medias);
        loadMediasFromDirectory(data.dirPath);
      }
      toggleDropdown();
    };

  const toggleOrganizeView = () => {
    const view = document.querySelector('.organize_panel') as HTMLElement;
    const scrollView = document.querySelector(
      '.media_scroll_view'
    ) as HTMLElement;
    if (showOrganizePanel) {
      if (!showInfoPanel) {
        scrollView.style.marginRight = '0';
      }
      view.style.right = '-376px';
    } else {
      scrollView.style.marginRight = '375px';
      view.style.right = '0';
    }
    showOrganizePanel = !showOrganizePanel;
  };

  const closeInfoPanel = () => {
    const infoPanel = document.querySelector('.info_panel') as HTMLElement;
    const scrollView = document.querySelector(
      '.media_scroll_view'
    ) as HTMLElement;
    if (!showOrganizePanel) {
      scrollView.style.marginRight = '0';
    }
    infoPanel.style.right = '-375px';
    infoPanel.ontransitionend = () => {
      setMediaInfo(null);
      infoPanel.ontransitionend = null;
    };
    showInfoPanel = false;
  };

  const onChapterAction = (isAddingMedia: boolean) =>
    setAddType(isAddingMedia ? actions.ADD_CHAPTER_MEDIA : actions.ADD_TAG);

  const onChapterSelected = (index: number) => setChapterIndex(index);

  const addMediaToChapter = (name: string, path: string) => {
    if (cIndexRef.current !== -1) {
      let oldChapter = chaptersRef.current[cIndexRef.current];
      let newChapter: Chapter = {
        ...oldChapter,
        medias: (oldChapter.medias || []).concat([{ name, path }]),
        modifiedDate: Date.now(),
      };
      saveChapter(newChapter);
    }
  };

  const onViewingChapter = (chapter: Chapter) => {
    setCurrentSource(chapter.name);
    setMediaFilter({
      ...mediaFilter,
      sortBy: { type: '', asc: true },
      extraSettings: { viewByTagOrder: '', withoutSelectedTags: false },
    });
    setMedias(chapter.medias || []);
  };

  const toggleFilterPanel = () => {
    const panel = document.querySelector('.filter_panel') as HTMLElement;
    panel.style.transition = 'top 0.6s ease-out';
    panel.ontransitionend = () => {
      panel.style.transition = '';
    };
    if (panel.style.top === '0px') {
      panel.style.top = '';
    } else {
      panel.style.top = '0';
    }
  };

  const showProcess = () => {
    const processView = document.querySelector('.processing') as HTMLElement;
    const processText = processView.childNodes[1] as HTMLSpanElement;
    processView.style.display = 'flex';
    processText.innerText = `Processing (${medias.length})`;
    processView.onmouseenter = () => {
      processText.innerText = processText.innerText.replace(
        'Processing',
        'Stop'
      );
      processView.style.backgroundColor = 'indigo';
    };
    processView.onmouseleave = () => {
      processText.innerText = processText.innerText.replace(
        'Stop',
        'Processing'
      );
      processView.style.backgroundColor = '';
    };
    processView.onclick = () => {
      stopProcess = true;
    };
  };

  const updateProcess = (text: string) => {
    const processView = document.querySelector('.processing') as HTMLElement;
    const processText = processView.childNodes[1] as HTMLSpanElement;
    processText.innerText = text;
  };

  const hideProcess = (reason?: string) => {
    const processView = document.querySelector('.processing') as HTMLElement;
    const processText = processView.childNodes[1] as HTMLSpanElement;
    if (reason) {
      processText.innerText = reason;
      processView.style.backgroundColor = 'indigo';
    } else {
      processText.innerText = 'Processing (0)';
      processView.style.backgroundColor = '';
      processView.style.display = 'none';
    }
    processView.onmouseenter = null;
    processView.onmouseleave = null;
    processView.onclick = null;
  };

  const matchTagWithSDPrompt = async () => {
    if (medias.length === 0) return;

    showProcess();
    let newInfos = [...savedInfos];
    let history: UpdateHistoryProps[] = [];
    for (let i = 0; i < medias.length; i++) {
      if (stopProcess) {
        hideProcess(`Process stopped (${i})`);
        stopProcess = false;
        return;
      }
      let SDprompt = SDProps.find((prop) => prop.ofMedia === medias[i].path);
      if (SDprompt) {
        let matchTags: Tag[] = medias[i].tags || [];
        let extractTags: string[] =
          SDprompt.prompt
            .split('\n')[0]
            .replace(/<lora:.{1,}>|\(|\)|\[|\]|\b:\d{1}.{0,1}\d{0,}|\B\s/g, '')
            .split(',') || [];
        for (let tag of extractTags) {
          let index = tags.findIndex((t: Tag) => tag === t.name);
          if (
            index !== -1 &&
            !matchTags.some(
              (t) => t.name === tags[index].name && t.type === tags[index].type
            )
          ) {
            matchTags.push(tags[index]);
          }
        }
        if (matchTags.length > 0) {
          let mediaIndex = newInfos.findIndex(
            (media) => media.path === medias[i].path
          );
          if (mediaIndex !== -1) {
            newInfos[mediaIndex] = {
              ...newInfos[mediaIndex],
              tags: matchTags,
              lastModifiedDate: Date.now(),
            };
          } else {
            newInfos.push({
              ...medias[i],
              tags: matchTags,
              lastModifiedDate: Date.now(),
            });
          }
          history.push({
            name: medias[i].name,
            path: medias[i].path,
            tags: matchTags,
            status: 'Updated',
          });
        }
      }
      updateProcess(`Processing (${medias.length - i})`);
    }
    setUpdateHistory(updateHistory.concat(history));
    saveMediaInfos(newInfos);
    hideProcess();
  };

  const extractTagsFromSD = () => {
    if (medias.length === 0) return;

    showProcess();
    let newInfos = [...savedInfos];
    let history: UpdateHistoryProps[] = [];
    for (let i = 0; i < medias.length; i++) {
      if (stopProcess) {
        hideProcess(`Process stopped (${i})`);
        return;
      }
      let SDprompt = SDProps.find(
        (prop) => prop.ofMedia === medias[i].path
      )?.prompt;
      if (SDprompt) {
        SDprompt = SDprompt.split('\n')[0];
        let extractTags = SDprompt.replace(
          /<lora:.{1,}>|\(|\)|\[|\]|\b:\d{1}.{0,1}\d{0,}|\B\s/g,
          ''
        )
          .replace(/,\s+/g, ',')
          .split(',');
        let filteredTags: Tag[] = medias[i].tags || [];
        for (let tag of extractTags) {
          //regex left to right: string does not start with white space AND does not include "masterpiece" or "best quality" AND only contain up to 3 white space inbetween
          if (
            /^((?=\S+)(?=^((?!(masterpiece|best quality)).)*$)(?=^([\S]+\s{0,}[\S]{0,}){0,3}$)).*$/g.test(
              tag
            ) &&
            !tags.some((t) => t.name === tag) &&
            !filteredTags.some((t) => t.name === tag)
          ) {
            filteredTags.push({ name: tag, type: 'common' });
          }
        }
        let imageIndex = newInfos.findIndex(
          (media) => media.path === medias[i].path
        );
        if (imageIndex !== -1) {
          newInfos[imageIndex].tags = filteredTags;
        } else {
          newInfos.push({
            ...medias[i],
            tags: filteredTags,
            lastModifiedDate: Date.now(),
          });
        }
        history.push({
          name: medias[i].name,
          path: medias[i].path,
          tags: filteredTags,
          status: 'Updated',
        });
      }
      updateProcess(`Processing (${medias.length - i})`);
    }
    setUpdateHistory(updateHistory.concat(history));
    saveMediaInfos(newInfos);
    hideProcess();
  };

  const undoUpdate = () => {
    if (updateHistory.length === 0) return;

    let newMedias = [...savedInfos];
    let newHistory = [...updateHistory];
    for (let i = 0; i < updateHistory.length; i++) {
      if (updateHistory[i].status === 'Updated') {
        let index = newMedias.findIndex(
          (media) => media.path === updateHistory[i].path
        );
        if (index !== -1) {
          newMedias[index] = {
            ...newMedias[index],
            tags: newMedias[index].tags?.filter(
              (t) =>
                !updateHistory[i].tags.some(
                  (t2) => t.name === t2.name && t.type === t2.type
                )
            ),
          };
          newHistory[i] = { ...updateHistory[i], status: 'Reverted' };
        }
      }
    }
    saveMediaInfos(newMedias);
    setUpdateHistory(newHistory);
  };

  const onQuickMatch = () => {
    setModal({
      visible: true,
      message: `Do you want to quick match ${medias.length} media(s)?`,
      onSubmit: matchTagWithSDPrompt,
    });
  };

  const onQuickExtract = () => {
    setModal({
      visible: true,
      message: `Do you want to extract SD prompt from ${medias.length} images(s)?`,
      onSubmit: extractTagsFromSD,
    });
  };

  const onUndoUpdate = () => {
    setModal({
      visible: true,
      message: `Do you want to undo ${updateHistory.length} update(s)?`,
      onSubmit: undoUpdate,
    });
  };

  const clearHistory = () => setUpdateHistory([]);

  const deleteSource = (index: number) => () => {
    let newSources = paths.filter((p, i) => i !== index);
    setPaths(newSources);
    store.set('savedPaths', JSON.stringify(newSources));
  };

  const refreshScrollView = () => {
    const scrollView = document.querySelector(
      '.media_scroll_view'
    ) as HTMLElement;
    if (scrollView) scrollView.scrollTop = 0;
  };

  const clearSource = (e: React.MouseEvent) => {
    setMedias([]);
    setCurrentSource('');
  };

  const updateAllTagInstances = (tag: Tag) => {
    setTagModal({ ...tagModal, visible: false });
    let newMedias: MediaInfo[] = [...savedInfos];
    for (let i = 0; i < newMedias.length; i++) {
      let index = newMedias[i].tags?.findIndex(
        (t) =>
          t.name === tagModal.initialTag.name &&
          t.type === tagModal.initialTag.type
      );
      if (index !== -1) {
        newMedias[i].tags[index] = tag;
      }
    }
    saveMediaInfos(newMedias);
  };

  const removeAllTagInstances = () => {
    setTagModal({ ...tagModal, visible: false });
    let newMedias = [...savedInfos];
    for (let i = 0; i < newMedias.length; i++) {
      newMedias[i].tags = newMedias[i].tags?.filter(
        (t) =>
          t.name !== tagModal.initialTag.name ||
          t.type !== tagModal.initialTag.type
      );
    }
    saveMediaInfos(newMedias);
  };

  const onUpdatingAllTags = (tag: UniqueTag, type: string) =>
    setTagModal({ visible: true, type: type, initialTag: tag });

  const onSubmitUpdateAllTags = (tag: Tag) => {
    if (tagModal.type === 'update') {
      updateAllTagInstances(tag);
    } else {
      removeAllTagInstances();
    }
  };

  const onCancelUpdateTag = () => setTagModal({ ...tagModal, visible: false });

  const getHighlightMedias: () => HighlightMedia[] = () => {
    let images: HighlightMedia[] = [];
    if (imageInfo) {
      images.push({ ...imageInfo, highlightType: 1 });
    }
    if (chapters[cIndex]?.medias) {
      images = images.concat(
        chapters[cIndex].medias?.map((c) => ({
          ...c,
          highlightType: 2,
        })) as HighlightMedia[]
      );
    }
    return images;
  };

  return (
    <div
      style={{
        background: `linear-gradient(200deg,
        ${colorGradients[appSettings.colorScheme].top} -30%,
        ${colorGradients[appSettings.colorScheme].middle} 48%,
        ${colorGradients[appSettings.colorScheme].bottom} 130%)`,
      }}
      className="content"
    >
      <MediaViewer onBackdropClicked={onBackdropClicked} src={mediaViewerSource} />
      {fileLoaded && (
        <>
          <div className="status_bar">
            <div className="connection_status">
              <span style={{ color: 'rgb(122, 245, 122)' }}>{wifiIP}</span>
              <span
                style={{ backgroundColor: 'rgb(122, 245, 122)' }}
                className="connection_status_dot"
              ></span>
            </div>
            <div className="divider" />
            <div className="folder_source">
              <div className={currentSource.length > 0 ? 'active_source' : ''}>
                <span onClick={toggleDropdown}>
                  {currentSource || 'Choose a source...'}
                </span>
                <FiDelete className="clear_source" onClick={clearSource} />
                <BiSolidChevronDown className="dropdown_icon" />
              </div>
              <div className="folder_source_dropdown">
                <ul>
                  {paths.map((path: string, index) => (
                    <li>
                      <span onClick={onDropdownItemClicked(path)}>{path}</span>
                      <span
                        className="remove_source"
                        onClick={deleteSource(index)}
                      >
                        remove
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="choose_folder_source">
              <div className="background" onClick={openDirectoryPicker} />
              <FcOpenedFolder className="folder_icon" />
            </div>
            <div className="divider" />
            <span className="transfer transparent_button">
              <div
                className="background"
                onClick={() => setTransferModal(true)}
              />
              Transfer
            </span>
            <span
              style={{
                backgroundColor:
                  mediaFilter.selectedTags.length > 0
                    ? 'yellowgreen'
                    : 'transparent',
              }}
              className="filter transparent_button"
              onClick={toggleFilterPanel}
            >
              <div className="background"></div>
              Filter
            </span>
            <span
              className="organize transparent_button"
              onClick={toggleOrganizeView}
            >
              <div className="background" />
              Organize
            </span>
          </div>
          <div className="img_container" onClick={onBlur}>
            <MediaScrollView
              highlightMedias={getHighlightMedias()}
              medias={medias}
              source={currentSource}
              onMediaClicked={toFullScreen}
              onMediaContextMenu={onMediaContextMenu}
              onMediaMouseEnter={onMediaMouseEnter}
              onMediaMouseLeave={onMediaMouseLeave}
              onInfoIconClicked={showMediaInfo}
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
            <InfoPanel
              info={imageInfo}
              onPanelClosed={closeInfoPanel}
              onMediaChanged={setMediaInfo}
            />
            <MediaPreview />
          </div>
          <MessageModal />
          <UpdateTagModal
            {...tagModal}
            onSubmit={onSubmitUpdateAllTags}
            onCancel={onCancelUpdateTag}
          />
          <LinkTransferModal
            visible={transferModal}
            onDismiss={() => setTransferModal(false)}
          />
          {/* <FilterPanel currentSource={currentSource} mediaInfos={medias} onUpdatingAllTags={onUpdatingAllTags}/> */}
          <ExtraSettings />
        </>
      )}
    </div>
  );
}

export default function App() {
  const [modal, setModal] = useState<ModalProps>({
    visible: false,
    message: '',
  });
  const [savedInfos, saveMediaInfos] = useMediaInfos();
  const [mediaFilter, setMediaFilter] = useMediaFilter();
  const [appSettings, saveAppSettings] = useAppSettings();
  const [chapters, saveChapter] = useChapters();
  const [SDProps, setSDProps] = useState<SDProps[]>([]);

  return (
    <AppContext.Provider
      value={{
        savedInfos,
        saveMediaInfos,
        mediaFilter,
        setMediaFilter,
        appSettings,
        saveAppSettings,
        chapters,
        saveChapter,
        SDProps,
        setSDProps,
      }}
    >
      <ModalContext.Provider value={{ modal, setModal }}>
        <Hello />
      </ModalContext.Provider>
    </AppContext.Provider>
  );
}
