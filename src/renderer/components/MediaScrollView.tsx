import React, { useContext, useEffect, useRef, useState } from 'react';
import '../componentCss/media_scroll_view.css';
import { AppContext } from 'renderer/constant/context';
import {
  HighlightMedia,
  MediaInfo,
  maxMediaLoad,
} from 'renderer/constant/types';
import MediaCard from './MediaCard';
import TransferModal from './TransferModal';

type MediaScrollViewProps = {
  highlightMedias: HighlightMedia[];
  medias: MediaInfo[];
  source: string;
  onMediaClicked: (
    e: React.MouseEvent,
    index: number,
    isVideo: boolean
  ) => void;
  onMediaContextMenu: (media: MediaInfo) => void;
  onMediaMouseEnter: (e: React.MouseEvent, media: MediaInfo) => void;
  onMediaMouseLeave: (e: React.MouseEvent, media: MediaInfo) => void;
  onInfoIconClicked: (media: MediaInfo) => void;
};

const indexes = [5, 4, 3, 2, 1];
let isLoadingNextPage = false;
let isFirstRender = true;

const MediaScrollView = ({
  highlightMedias,
  medias,
  source,
  onMediaClicked,
  onMediaContextMenu,
  onMediaMouseEnter,
  onMediaMouseLeave,
  onInfoIconClicked,
}: MediaScrollViewProps) => {
  const [page, setPage] = useState(1);
  const [filteredMedias, setFilteredMedias] = useState<MediaInfo[]>([]);
  const { savedInfos, mediaFilter, appSettings, SDProps } =
    useContext(AppContext);
  const intersectObserver = useRef<IntersectionObserver | undefined>();
  const pageRef = useRef(1);

  pageRef.current = page;

  useEffect(() => {
    const scrollView = document.querySelector('.media_scoll_view');
    if (scrollView) {
      intersectObserver.current = new IntersectionObserver(
        handleCardIntersection,
        {
          root: scrollView,
          rootMargin: `${scrollView.clientHeight * 3}px 0px ${
            scrollView.clientHeight * 3
          }px 0px`,
          threshold: 0.2,
        }
      );
    }
    return () => {
      intersectObserver.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    setPage(1);
    filterMedia();
  }, [medias]);

  useEffect(() => {
    if (!isFirstRender) {
      filterMedia();
    } else {
      isFirstRender = false;
    }
  }, [mediaFilter]);

  useEffect(() => {
    const scrollView = document.querySelector(
      '.media_scoll_view'
    ) as HTMLElement;
    if (scrollView) {
      scrollView.scrollTop = 0;
    }
  }, [appSettings.showInRow]);

  const handleCardIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
        let path = (entry.target as HTMLElement).dataset['path'];
        if (path)
          (
            (entry.target as HTMLElement).querySelector(
              '.media'
            ) as HTMLMediaElement
          ).src = path;
      } else {
        (
          (entry.target as HTMLElement).querySelector(
            '.media'
          ) as HTMLMediaElement
        ).src = '';
      }
    });
  };

  const filterMedia = () => {
    if (medias.length === 0) {
      setFilteredMedias([]);
      return;
    }
    let newMedias = medias.map(
      (i) => savedInfos.find((i2) => i.path === i2.path) || i
    );
    if (mediaFilter.selectedTags.length > 0) {
      let direction = mediaFilter.extraSettings.viewByTagOrder;
      if (direction.length > 0) {
        newMedias = newMedias.filter((t) => {
          if (t.tags) {
            for (let tag of t.tags) {
              if (
                mediaFilter.selectedTags.some(
                  (t) => t.name === tag.name && t.type === tag.type
                )
              ) {
                return true;
              }
            }
          }
          return false;
        });
        newMedias.sort((i1, i2) => {
          let total1 = i1.tags?.reduce((total, tag) => {
            let index = mediaFilter.selectedTags.findIndex(
              (t) => t.name === tag.name && t.type === tag.type
            );
            if (index !== -1) {
              return direction === 'leftToRight'
                ? total + (index + 1)
                : total - (index + 1);
            }
            return total;
          }, 0);
          let total2 = i2.tags?.reduce((total, tag) => {
            let index = mediaFilter.selectedTags.findIndex(
              (t) => t.name === tag.name && t.type === tag.type
            );
            if (index !== -1) {
              return direction === 'leftToRight'
                ? total + (index + 1)
                : total - (index + 1);
            }
            return total;
          }, 0);
          return (total1 || 0) - (total2 || 0);
        });
        setFilteredMedias(newMedias);
        return;
      }
      if (mediaFilter.sortBy.type === 'Most relevant') {
        newMedias.sort((i1, i2) => {
          let total1 =
            i1.tags?.reduce(
              (total, tag) =>
                total +
                (mediaFilter.selectedTags.some(
                  (t) => t.name === tag.name && t.type === tag.type
                )
                  ? 1
                  : 0),
              0
            ) || 0;
          let total2 =
            i2.tags?.reduce(
              (total, tag) =>
                total +
                (mediaFilter.selectedTags.some(
                  (t) => t.name === tag.name && t.type === tag.type
                )
                  ? 1
                  : 0),
              0
            ) || 0;
          return mediaFilter.sortBy.asc ? total1 - total2 : total2 - total1;
        });
        setFilteredMedias(newMedias);
        return;
      }
      if (mediaFilter.extraSettings.withoutSelectedTags) {
        newMedias = newMedias.filter((media) => {
          if (media.tags) {
            for (let tag of media.tags) {
              if (
                mediaFilter.selectedTags.some(
                  (t) => t.name === tag.name && t.type === tag.type
                )
              ) {
                return false;
              }
            }
          }
          return true;
        });
      } else {
        newMedias = newMedias.filter((media) => {
          if (media.tags) {
            for (let tag of mediaFilter.selectedTags) {
              if (
                !media.tags.some(
                  (t) => t.name === tag.name && t.type === tag.type
                )
              ) {
                return false;
              }
            }
            return true;
          } else {
            return false;
          }
        });
      }
    }
    if (mediaFilter.sortBy.type === 'Date created') {
      newMedias.sort((i1, i2) =>
        mediaFilter.sortBy.asc
          ? (i1.createdDate || 0) - (i2.createdDate || 0)
          : (i2.createdDate || 0) - (i1.createdDate || 0)
      );
      setFilteredMedias(newMedias);
      return;
    }
    if (mediaFilter.sortBy.type === 'Date modified') {
      newMedias.sort((i1, i2) =>
        mediaFilter.sortBy.asc
          ? (i1.lastModifiedDate || 0) - (i2.lastModifiedDate || 0)
          : (i2.lastModifiedDate || 0) - (i1.lastModifiedDate || 0)
      );
      setFilteredMedias(newMedias);
      return;
    }
    setFilteredMedias(newMedias);
  };

  const onScroll = (e: React.UIEvent) => {
    const scrollView = e.target as HTMLElement;
    if (pageRef.current * maxMediaLoad < medias.length) {
      scrollView.onscroll = () => {
        if (
          scrollView.clientHeight + scrollView.scrollTop >=
            scrollView.scrollHeight &&
          !isLoadingNextPage
        ) {
          isLoadingNextPage = true;
          setPage(pageRef.current + 1);
          setTimeout(() => {
            isLoadingNextPage = false;
          }, 500);
        }
      };
    }
  };

  const getHighlighType = (path: string) => {
    return highlightMedias.find((m) => m.path === path)?.highlightType || -1;
  };

  return (
    <div className="media_scoll_view" onScroll={onScroll}>
      <TransferModal source={source} medias={filteredMedias} />
      {appSettings.showInRow ? (
        <div className="row">
          {filteredMedias
            .filter((media, index) => index <= maxMediaLoad * page)
            .map((media, index) => (
              <MediaCard
                key={index}
                media={media}
                SDprompt={
                  SDProps.find((prop) => prop.ofMedia === media.path)?.prompt
                }
                highlight={getHighlighType(media.path)}
                index={index}
                intersect={intersectObserver.current}
                onMediaClicked={onMediaClicked}
                onMediaContextMenu={onMediaContextMenu}
                onMediaMouseEnter={onMediaMouseEnter}
                onMediaMouseLeave={onMediaMouseLeave}
                onInfoIconClicked={onInfoIconClicked}
              />
            ))}
        </div>
      ) : (
        indexes.map((value) => (
          <div className="column">
            {filteredMedias
              .filter(
                (media, index) =>
                  (index + value) % 5 === 0 && index <= maxMediaLoad * page
              )
              .map((media, index) => (
                <MediaCard
                  key={index}
                  media={media}
                  SDprompt={
                    SDProps.find((prop) => prop.ofMedia === media.path)?.prompt
                  }
                  highlight={getHighlighType(media.path)}
                  index={filteredMedias.findIndex((i) => i.path === media.path)}
                  intersect={intersectObserver.current}
                  onMediaClicked={onMediaClicked}
                  onMediaContextMenu={onMediaContextMenu}
                  onMediaMouseEnter={onMediaMouseEnter}
                  onMediaMouseLeave={onMediaMouseLeave}
                  onInfoIconClicked={onInfoIconClicked}
                />
              ))}
          </div>
        ))
      )}
    </div>
  );
};

export default MediaScrollView;
