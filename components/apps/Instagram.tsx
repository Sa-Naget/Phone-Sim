"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion, PanInfo, useDragControls } from "framer-motion";
import { usePhoneStore } from "../../store/usePhoneStore";
import { cn } from "@/lib/utils";
import StatusBar from "../phone/StatusBar";

// ---- Data model --------------------------------------------------------

interface PostComment {
  username: string;
  text: string;
}

interface PostData {
  id: string;
  username: string;
  avatarUrl: string;
  postImageUrl: string;
  location: string;
  likesCount: number; // base count, the live count adds +1 when liked
  likedBy: string; // the single name shown in "Liked by X and N others"
  caption: string;
  comments: PostComment[];
  timeAgo: string;
}

interface StoryData {
  id: string;
  username: string;
  avatarUrl: string;
  storyImageUrl: string;
}

// ---- Mock data: swap these URLs and strings for your narrative content ----

const avatar = (id: string) =>
  `https://images.unsplash.com/${id}?w=160&h=160&fit=crop&crop=faces&auto=format&q=80`;
const photo = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=80`;

const POSTS_DATA: PostData[] = [
  {
    id: "p1",
    username: "agetta",
    avatarUrl: avatar("photo-1500648767791-00dcc994a43e"),
    postImageUrl: photo("photo-1506744038136-46273834b3fb"),
    location: "late night thoughts",
    likesCount: 1242,
    likedBy: "utami",
    caption: "some things are better left unsent",
    comments: [
      { username: "utami", text: "ok what does this mean" },
      { username: "nora.exe", text: "@agetta you good??" },
      { username: "the.crew", text: "someone check on him" },
    ],
    timeAgo: "2 hours ago",
  },
  {
    id: "p2",
    username: "nora.exe",
    avatarUrl: avatar("photo-1494790108377-be9c29b29330"),
    postImageUrl: photo("photo-1501785888041-af3ef285b470"),
    location: "home",
    likesCount: 318,
    likedBy: "agetta",
    caption: "285 days left and counting 🩷",
    comments: [
      { username: "utami", text: "the countdown reference I'M SOBBING" },
      { username: "agetta", text: "almost there" },
    ],
    timeAgo: "6 hours ago",
  },
  {
    id: "p3",
    username: "utami",
    avatarUrl: avatar("photo-1438761681033-6461ffad8d80"),
    postImageUrl: photo("photo-1470071459604-3b5ec3a7fe05"),
    location: "somewhere foggy",
    likesCount: 764,
    likedBy: "nora.exe",
    caption: "met up early. nobody told me it would be this cold",
    comments: [{ username: "the.crew", text: "we told you to bring a jacket" }],
    timeAgo: "1 day ago",
  },
];

const STORIES_DATA: StoryData[] = [
  {
    id: "agetta",
    username: "agetta",
    avatarUrl: avatar("photo-1500648767791-00dcc994a43e"),
    storyImageUrl: photo("photo-1469474968028-56623f02e42e", 1000),
  },
  {
    id: "utami",
    username: "utami",
    avatarUrl: avatar("photo-1438761681033-6461ffad8d80"),
    storyImageUrl: photo("photo-1518837695005-2083093ee35b", 1000),
  },
  {
    id: "nora",
    username: "nora.exe",
    avatarUrl: avatar("photo-1494790108377-be9c29b29330"),
    storyImageUrl: photo("photo-1476514525535-07fb3b4ae5f1", 1000),
  },
  {
    id: "crew",
    username: "the.crew",
    avatarUrl: avatar("photo-1507003211169-0a1dd7228f2d"),
    storyImageUrl: photo("photo-1488646953014-85cb44e25828", 1000),
  },
  {
    id: "mika",
    username: "mika",
    avatarUrl: avatar("photo-1517841905240-472988babdf9"),
    storyImageUrl: photo("photo-1501785888041-af3ef285b470", 1000),
  },
];

const MY_AVATAR_URL = STORIES_DATA[0].avatarUrl;

// ---- Scrollbar suppression ----------------------------------------------
// Firefox/legacy Edge use the inline style, WebKit/Blink use the arbitrary
// variant on ::-webkit-scrollbar. Apply both to every scrollable container.

const NO_SCROLLBAR_CLASS = "[&::-webkit-scrollbar]:hidden";
const NO_SCROLLBAR_STYLE: CSSProperties = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

// ---- Icons (inline SVG, 24x24 viewBox) ------------------------------------

function HeartIcon({ filled = false, size = 24 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938z"
        fill={filled ? "#ff3040" : "none"}
        stroke={filled ? "#ff3040" : "currentColor"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="22" y1="3" x2="9.218" y2="10.083" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polygon
        points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon({ filled = false, size = 24 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polygon
        points="20 21 12 13.44 4 21 4 3 20 3 20 21"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="6" cy="12" r="1.7" />
      <circle cx="18" cy="12" r="1.7" />
    </svg>
  );
}

function MessengerIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12.003 2.001a9.705 9.705 0 110 19.4 10.876 10.876 0 01-2.895-.384.798.798 0 00-.533.04l-1.984.876a.801.801 0 01-1.123-.708l-.054-1.78a.806.806 0 00-.27-.569 9.49 9.49 0 01-3.14-7.175 9.65 9.65 0 0110-9.7z"
        stroke="currentColor"
        strokeWidth="1.739"
        strokeMiterlimit="10"
      />
      <path
        d="M17.79 10.132a.659.659 0 00-.962-.873l-2.556 2.05a.63.63 0 01-.758.002L11.06 9.47a1.576 1.576 0 00-2.277.42l-2.567 3.98a.659.659 0 00.961.875l2.556-2.049a.63.63 0 01.759-.002l2.452 1.84a1.576 1.576 0 002.278-.42z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

function HomeIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.005 16.545a2.997 2.997 0 012.997-2.997h0A2.997 2.997 0 0115 16.545V22h7V11.543L12 2 2 11.543V22h7.005z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SearchIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CreateIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="7.5" x2="12" y2="16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="7.5" y1="12" x2="16.5" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ReelsIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="2.049" y1="7.002" x2="21.95" y2="7.002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="13.504" y1="2.001" x2="16.204" y2="7.002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="7.207" y1="2.001" x2="9.907" y2="7.002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M2 12.001v3.449c0 2.849.698 4.006 1.606 4.945.94.908 2.098 1.607 4.946 1.607h6.896c2.848 0 4.006-.699 4.946-1.607.908-.939 1.606-2.096 1.606-4.945V8.552c0-2.848-.698-4.006-1.606-4.945C19.454 2.699 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.546 2 5.704 2 8.552z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9.763 17.664a.908.908 0 01-.454-.787V11.63a.909.909 0 011.364-.788l4.545 2.624a.909.909 0 010 1.575l-4.545 2.624a.91.91 0 01-.91 0z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

function CloseIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ---- Story viewer (auto-advances, tap zones, swipe down to close) --------

const STORY_DURATION_SECONDS = 5;

function StoryViewer({
  stories,
  index,
  onClose,
  onChangeIndex,
}: {
  readonly stories: StoryData[];
  readonly index: number;
  readonly onClose: () => void;
  readonly onChangeIndex: (i: number) => void;
}) {
  const story = stories[index];
  if (!story) return null;

  const goNext = () => {
    if (index < stories.length - 1) onChangeIndex(index + 1);
    else onClose();
  };
  const goPrev = () => {
    if (index > 0) onChangeIndex(index - 1);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 100 || info.velocity.y > 600) onClose();
  };

  return (
    <motion.div
      key="story-viewer"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.2 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 z-40 bg-black flex flex-col"
    >
      <div className="pt-12 px-2 flex gap-1">
        {stories.map((s, i) => (
          <div key={s.id} className="flex-1 h-[2.5px] rounded-full bg-white/30 overflow-hidden">
            {i < index && <div className="h-full w-full bg-white" />}
            {i === index && (
              <motion.div
                key={`progress-${index}`}
                className="h-full bg-white"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: STORY_DURATION_SECONDS, ease: "linear" }}
                onAnimationComplete={goNext}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <img
          src={story.avatarUrl}
          alt={story.username}
          className="w-8 h-8 rounded-full object-cover bg-neutral-800"
        />
        <span className="text-white text-[14px] font-semibold">{story.username}</span>
        <span className="text-white/60 text-[13px]">2h</span>
        <div className="flex-1" />
        <button
          onClick={onClose}
          aria-label="Close story"
          className="text-white p-1 active:scale-95 transition-all duration-100 cursor-pointer"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="relative flex-1 bg-neutral-900">
        <img src={story.storyImageUrl} alt="" className="w-full h-full object-cover" />
        <button
          onClick={goPrev}
          className="absolute inset-y-0 left-0 w-1/3"
          aria-label="Previous story"
        />
        <button
          onClick={goNext}
          className="absolute inset-y-0 right-0 w-2/3"
          aria-label="Next story"
        />
      </div>
    </motion.div>
  );
}

// ---- Story tray ---------------------------------------------------------

function StoryTray({
  stories,
  viewed,
  onOpenStory,
}: {
  readonly stories: StoryData[];
  readonly viewed: Record<string, boolean>;
  readonly onOpenStory: (index: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex gap-3.5 px-3 py-3 overflow-x-auto border-b border-black/5",
        NO_SCROLLBAR_CLASS
      )}
      style={NO_SCROLLBAR_STYLE}
    >
      {stories.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onOpenStory(i)}
          className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-all duration-100 cursor-pointer"
        >
          <div
            className={cn(
              "w-[66px] h-[66px] rounded-full p-[2.5px]",
              viewed[s.id]
                ? "bg-neutral-300"
                : "bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]"
            )}
          >
            <div className="w-full h-full rounded-full bg-white p-[2.5px]">
              <img
                src={s.avatarUrl}
                alt={s.username}
                className="w-full h-full rounded-full object-cover bg-neutral-200"
              />
            </div>
          </div>
          <span className="text-[11px] text-neutral-800 truncate w-[66px] text-center">
            {s.username}
          </span>
        </button>
      ))}
    </div>
  );
}

// ---- Post card ----------------------------------------------------------

function PostCard({
  post,
  liked,
  saved,
  expanded,
  showHeartPulse,
  onToggleLike,
  onToggleSave,
  onToggleComments,
  onDoubleTapImage,
}: {
  readonly post: PostData;
  readonly liked: boolean;
  readonly saved: boolean;
  readonly expanded: boolean;
  readonly showHeartPulse: boolean;
  readonly onToggleLike: () => void;
  readonly onToggleSave: () => void;
  readonly onToggleComments: () => void;
  readonly onDoubleTapImage: () => void;
}) {
  const liveLikeCount = post.likesCount + (liked ? 1 : 0);
  const iconButton =
    "text-[#262626] active:scale-95 transition-all duration-100 cursor-pointer";

  return (
    <article className="pb-1">
      {/* User row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <button className="flex items-center gap-2.5 active:scale-95 transition-all duration-100 cursor-pointer">
          <img
            src={post.avatarUrl}
            alt={post.username}
            className="w-8 h-8 rounded-full object-cover bg-neutral-200"
          />
          <div className="flex flex-col leading-tight text-left">
            <span className="text-[13px] font-semibold text-black">{post.username}</span>
            <span className="text-[11px] text-neutral-500">{post.location}</span>
          </div>
        </button>
        <div className="flex-1" />
        <button aria-label="More options" className={iconButton}>
          <DotsIcon />
        </button>
      </div>

      {/* Image */}
      <div
        className="relative w-full aspect-[4/5] bg-neutral-200 select-none"
        onDoubleClick={onDoubleTapImage}
      >
        <img src={post.postImageUrl} alt="" className="w-full h-full object-cover" draggable={false} />
        <AnimatePresence>
          {showHeartPulse && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 1.35, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <svg width="96" height="96" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 013.679-1.938z" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 px-3 pt-2.5">
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={onToggleLike}
          aria-label={liked ? "Unlike" : "Like"}
          className="text-[#262626] cursor-pointer"
        >
          <motion.span
            key={liked ? "liked" : "unliked"}
            initial={{ scale: liked ? 0.6 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 14 }}
            className="block"
          >
            <HeartIcon filled={liked} />
          </motion.span>
        </motion.button>
        <button onClick={onToggleComments} aria-label="Comments" className={iconButton}>
          <CommentIcon />
        </button>
        <button aria-label="Share" className={iconButton}>
          <ShareIcon />
        </button>
        <div className="flex-1" />
        <button
          onClick={onToggleSave}
          aria-label={saved ? "Remove from saved" : "Save"}
          className={iconButton}
        >
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      {/* Likes */}
      <div className="px-3 pt-1.5 text-[13px] text-black">
        Liked by <span className="font-semibold">{post.likedBy}</span> and{" "}
        <span className="font-semibold">{liveLikeCount.toLocaleString()} others</span>
      </div>

      {/* Caption */}
      <div className="px-3 pt-0.5 text-[13px] text-black">
        <span className="font-semibold">{post.username}</span> {post.caption}
      </div>

      {/* Comments */}
      <div className="px-3 pt-1">
        {!expanded && post.comments.length > 0 && (
          <button
            onClick={onToggleComments}
            className="text-[13px] text-neutral-500 active:opacity-60 cursor-pointer"
          >
            View all {post.comments.length} comments
          </button>
        )}
        {expanded && (
          <div className="flex flex-col gap-1">
            {post.comments.map((c) => (
              <div key={`${c.username}-${c.text}`} className="text-[13px] text-black">
                <span className="font-semibold">{c.username}</span> {c.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 pt-1 pb-3">
        <span className="text-[10.5px] text-neutral-500 tracking-wide uppercase">
          {post.timeAgo}
        </span>
      </div>
    </article>
  );
}

// ---- Header -------------------------------------------------------------

function Header({
  onPointerDown,
}: {
  readonly onPointerDown: (e: React.PointerEvent) => void;
}) {
  const iconButton =
    "text-[#262626] active:scale-95 transition-all duration-100 cursor-pointer";
  return (
    <div
      onPointerDown={onPointerDown}
      style={{ touchAction: "none" }}
      className="pt-12 pb-2 px-4 flex items-center justify-between bg-white"
    >
      <span className="font-serif italic font-semibold text-[28px] tracking-tight text-black leading-none">
        Instagram
      </span>
      <div className="flex items-center gap-4">
        <button aria-label="Notifications" className={iconButton}>
          <HeartIcon />
        </button>
        <button aria-label="Messages" className={iconButton}>
          <MessengerIcon />
        </button>
      </div>
    </div>
  );
}

// ---- Bottom navigation --------------------------------------------------

type TabId = "home" | "search" | "create" | "reels" | "profile";

function BottomTabBar({
  activeTab,
  onSelect,
}: {
  readonly activeTab: TabId;
  readonly onSelect: (tab: TabId) => void;
}) {
  const tabButton =
    "flex-1 flex items-center justify-center py-1 text-[#262626] active:scale-95 transition-all duration-100 cursor-pointer";

  return (
    <nav className="flex items-center px-2 pt-2 pb-6 border-t border-black/10 bg-white">
      <button onClick={() => onSelect("home")} aria-label="Home" className={tabButton}>
        <HomeIcon active={activeTab === "home"} />
      </button>
      <button onClick={() => onSelect("search")} aria-label="Search" className={tabButton}>
        <SearchIcon />
      </button>
      <button onClick={() => onSelect("create")} aria-label="Create" className={tabButton}>
        <CreateIcon />
      </button>
      <button onClick={() => onSelect("reels")} aria-label="Reels" className={tabButton}>
        <ReelsIcon />
      </button>
      <button onClick={() => onSelect("profile")} aria-label="Profile" className={tabButton}>
        <span
          className={cn(
            "block w-[26px] h-[26px] rounded-full overflow-hidden",
            activeTab === "profile" ? "ring-2 ring-black ring-offset-1" : "ring-1 ring-black/20"
          )}
        >
          <img src={MY_AVATAR_URL} alt="Profile" className="w-full h-full object-cover bg-neutral-200" />
        </span>
      </button>
    </nav>
  );
}

// ---- Root component -----------------------------------------------------

export default function InstagramApp() {
  const closeApp = usePhoneStore((s) => s.closeApp);

  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [viewedStories, setViewedStories] = useState<Record<string, boolean>>({});
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [heartPulsePostId, setHeartPulsePostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("home");

  const feedRef = useRef<HTMLDivElement>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    return () => {
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
    };
  }, []);

  const toggleLike = (postId: string) =>
    setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));

  const toggleSave = (postId: string) =>
    setSavedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));

  const toggleComments = (postId: string) =>
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));

  // Double-tap only ever likes, never unlikes (matches the real app)
  const handleDoubleTapImage = (postId: string) => {
    setLikedPosts((prev) => ({ ...prev, [postId]: true }));
    setHeartPulsePostId(postId);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setHeartPulsePostId(null), 650);
  };

  const openStory = (index: number) => {
    setActiveStoryIndex(index);
    setViewedStories((prev) => ({ ...prev, [STORIES_DATA[index].id]: true }));
  };

  const changeStory = (index: number) => {
    setActiveStoryIndex(index);
    setViewedStories((prev) => ({ ...prev, [STORIES_DATA[index].id]: true }));
  };

  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === "home") feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Swipe-down-to-close is bound to the header only, so it never fights the
  // feed's own vertical scrolling.
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 110 || info.velocity.y > 600) closeApp();
  };

  return (
    <div className="absolute inset-0 bg-white overflow-hidden">
      <motion.div
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        className="absolute inset-0 z-10 bg-white flex flex-col"
      >
        <StatusBar dark />
        <Header onPointerDown={(e) => dragControls.start(e)} />

        <div
          ref={feedRef}
          className={cn("flex-1 overflow-y-auto", NO_SCROLLBAR_CLASS)}
          style={NO_SCROLLBAR_STYLE}
        >
          <StoryTray stories={STORIES_DATA} viewed={viewedStories} onOpenStory={openStory} />

          {POSTS_DATA.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              liked={!!likedPosts[post.id]}
              saved={!!savedPosts[post.id]}
              expanded={!!expandedComments[post.id]}
              showHeartPulse={heartPulsePostId === post.id}
              onToggleLike={() => toggleLike(post.id)}
              onToggleSave={() => toggleSave(post.id)}
              onToggleComments={() => toggleComments(post.id)}
              onDoubleTapImage={() => handleDoubleTapImage(post.id)}
            />
          ))}
        </div>

        <BottomTabBar activeTab={activeTab} onSelect={selectTab} />
      </motion.div>

      <AnimatePresence>
        {activeStoryIndex !== null && (
          <StoryViewer
            stories={STORIES_DATA}
            index={activeStoryIndex}
            onClose={() => setActiveStoryIndex(null)}
            onChangeIndex={changeStory}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
