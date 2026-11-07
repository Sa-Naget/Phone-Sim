"use client";

import { useState } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { usePhoneStore } from "../../store/usePhoneStore";
import { cn } from "@/lib/utils";
import StatusBar from "../phone/StatusBar";

// ---- Data model --------------------------------------------------------

interface StoryUser {
  id: string;
  username: string;
  avatar: string;
  storyImage: string;
  viewed?: boolean;
}

interface Comment {
  username: string;
  text: string;
}

interface Post {
  id: string;
  username: string;
  avatar: string;
  location?: string;
  image: string;
  liked: boolean;
  likeCount: number;
  likedByUsername: string;
  caption: string;
  comments: Comment[];
  timeAgo: string;
}

const STORIES: StoryUser[] = [
  { id: "agetta", username: "agetta", avatar: "/avatars/agetta.jpeg", storyImage: "/stories/agetta-1.jpg" },
  { id: "utami", username: "utami", avatar: "/avatars/utami.jpeg", storyImage: "/stories/utami-1.jpg" },
  { id: "nora", username: "nora.exe", avatar: "/avatars/nora.jpeg", storyImage: "/stories/nora-1.jpg" },
  { id: "group", username: "the.crew", avatar: "/avatars/group.jpeg", storyImage: "/stories/group-1.jpg" },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "p1",
    username: "agetta",
    avatar: "/avatars/agetta.jpeg",
    location: "late night thoughts",
    image: "/posts/p1.jpg",
    liked: false,
    likeCount: 1242,
    likedByUsername: "utami",
    caption: "some things are better left unsent",
    comments: [
      { username: "utami", text: "ok what does this mean" },
      { username: "nora.exe", text: "@agetta you good??" },
      { username: "the.crew", text: "someone check on him" },
    ],
    timeAgo: "2h",
  },
  {
    id: "p2",
    username: "nora.exe",
    avatar: "/avatars/nora.jpeg",
    location: "home",
    image: "/posts/p2.jpg",
    liked: true,
    likeCount: 318,
    likedByUsername: "agetta",
    caption: "285 days left and counting 🩷",
    comments: [{ username: "utami", text: "the countdown widget reference I'M SOBBING" }],
    timeAgo: "6h",
  },
];

// ---- Story viewer ---------------------------------------------------

function StoryViewer({
  stories,
  index,
  onClose,
  onChangeIndex,
}: {
  stories: StoryUser[];
  index: number;
  onClose: () => void;
  onChangeIndex: (i: number) => void;
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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 z-40 bg-black flex flex-col"
    >
      <div className="pt-14 px-2 flex gap-1">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-[2.5px] rounded-full bg-white/30 overflow-hidden">
            <div
              className={cn(
                "h-full bg-white",
                i < index ? "w-full" : i === index ? "w-full" : "w-0"
              )}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <img src={story.avatar} alt={story.username} className="w-8 h-8 rounded-full object-cover bg-ios-card2" />
        <span className="text-white text-[14px] font-semibold">{story.username}</span>
        <span className="text-white/60 text-[13px]">2h</span>
        <div className="flex-1" />
        <button onClick={onClose} className="text-white p-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 3l14 14M17 3L3 17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="relative flex-1">
        <img src={story.storyImage} alt="" className="w-full h-full object-cover" />
        <button onClick={goPrev} className="absolute inset-y-0 left-0 w-1/3" aria-label="Previous story" />
        <button onClick={goNext} className="absolute inset-y-0 right-0 w-2/3" aria-label="Next story" />
      </div>
    </motion.div>
  );
}

// ---- Story tray ---------------------------------------------------

function StoryTray({
  stories,
  onOpenStory,
}: {
  stories: StoryUser[];
  onOpenStory: (index: number) => void;
}) {
  return (
    <div className="flex gap-4 px-4 py-3 overflow-x-auto border-b border-black/5">
      {stories.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onOpenStory(i)}
          className="flex flex-col items-center gap-1 shrink-0 active:opacity-70"
        >
          <div
            className={cn(
              "w-[62px] h-[62px] rounded-full p-[2.5px]",
              s.viewed
                ? "bg-gray-300"
                : "bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]"
            )}
          >
            <div className="w-full h-full rounded-full bg-white p-[2.5px]">
              <img
                src={s.avatar}
                alt={s.username}
                className="w-full h-full rounded-full object-cover bg-ios-card2"
              />
            </div>
          </div>
          <span className="text-[11px] text-black/80 truncate w-[64px] text-center">
            {s.username}
          </span>
        </button>
      ))}
    </div>
  );
}

// ---- Post card ---------------------------------------------------

function PostCard({
  post,
  expanded,
  onToggleComments,
  onToggleLike,
  onDoubleTapImage,
  showHeartPulse,
}: {
  post: Post;
  expanded: boolean;
  onToggleComments: () => void;
  onToggleLike: () => void;
  onDoubleTapImage: () => void;
  showHeartPulse: boolean;
}) {
  return (
    <div className="pb-1">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <img
          src={post.avatar}
          alt={post.username}
          className="w-8 h-8 rounded-full object-cover bg-ios-card2"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold text-black">{post.username}</span>
          {post.location && (
            <span className="text-[11px] text-ios-gray">{post.location}</span>
          )}
        </div>
        <div className="flex-1" />
        <button>
          <svg width="18" height="4" viewBox="0 0 18 4" fill="none">
            <circle cx="2" cy="2" r="1.6" fill="#262626" />
            <circle cx="9" cy="2" r="1.6" fill="#262626" />
            <circle cx="16" cy="2" r="1.6" fill="#262626" />
          </svg>
        </button>
      </div>

      <div className="relative w-full aspect-[4/5] bg-ios-card2" onDoubleClick={onDoubleTapImage}>
        <img src={post.image} alt="" className="w-full h-full object-cover" />
        <AnimatePresence>
          {showHeartPulse && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <svg width="90" height="90" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0.5">
                <path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2 5 5.4 5c2 0 3.4 1.1 4.1 2.2.3.4.9.4 1.1 0C11.2 6.1 12.6 5 14.6 5 18 5 19.6 8.4 18 11.7 15.5 16.4 12 21 12 21z" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 px-3 pt-2.5">
        <button onClick={onToggleLike} className="active:scale-90 transition-transform">
          {post.liked ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff3040">
              <path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2 5 5.4 5c2 0 3.4 1.1 4.1 2.2.3.4.9.4 1.1 0C11.2 6.1 12.6 5 14.6 5 18 5 19.6 8.4 18 11.7 15.5 16.4 12 21 12 21z" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2 5 5.4 5c2 0 3.4 1.1 4.1 2.2.3.4.9.4 1.1 0C11.2 6.1 12.6 5 14.6 5 18 5 19.6 8.4 18 11.7 15.5 16.4 12 21 12 21z"
                stroke="#262626"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <button onClick={onToggleComments} className="active:scale-90 transition-transform">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 11.5a8.5 8.5 0 01-12.4 7.55L3 21l1.95-5.6A8.5 8.5 0 1121 11.5z"
              stroke="#262626"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button className="active:scale-90 transition-transform">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#262626" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1" />
        <button className="active:scale-90 transition-transform">
          <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
            <path d="M1 1h18v20l-9-5-9 5V1z" stroke="#262626" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="px-3 pt-1.5">
        <span className="text-[13px] font-semibold text-black">
          Liked by {post.likedByUsername} and {post.likeCount.toLocaleString()} others
        </span>
      </div>

      <div className="px-3 pt-0.5 text-[13px] text-black">
        <span className="font-semibold">{post.username}</span> {post.caption}
      </div>

      <div className="px-3 pt-1 pb-0.5">
        {!expanded && post.comments.length > 0 && (
          <button onClick={onToggleComments} className="text-[13px] text-ios-gray">
            View all {post.comments.length} comments
          </button>
        )}
        {expanded && (
          <div className="flex flex-col gap-1">
            {post.comments.map((c, i) => (
              <div key={i} className="text-[13px] text-black">
                <span className="font-semibold">{c.username}</span> {c.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 pt-1 pb-3">
        <span className="text-[10.5px] text-ios-gray tracking-wide uppercase">{post.timeAgo} ago</span>
      </div>
    </div>
  );
}

// ---- Bottom tab bar ---------------------------------------------------

function BottomTabBar({ myAvatar }: { myAvatar: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-2.5 border-t border-black/10 bg-white">
      <button>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V10.5z" stroke="#262626" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      </button>
      <button>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7.5" stroke="#262626" strokeWidth="1.7" />
          <path d="M21 21l-4.5-4.5" stroke="#262626" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>
      <button>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" stroke="#262626" strokeWidth="1.7" />
          <path d="M12 7v10M7 12h10" stroke="#262626" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>
      <button>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="4" stroke="#262626" strokeWidth="1.7" />
          <path d="M9 7l8 5-8 5V7z" fill="#262626" />
        </svg>
      </button>
      <button className="w-6 h-6 rounded-full overflow-hidden border border-black/20">
        <img src={myAvatar} alt="Profile" className="w-full h-full object-cover bg-ios-card2" />
      </button>
    </div>
  );
}

// ---- Header ---------------------------------------------------

function Header() {
  return (
    <div className="pt-14 pb-2 px-4 flex items-center justify-between bg-white">
      <span className="font-serif italic font-semibold text-[27px] tracking-tight text-black">
        Instagram
      </span>
      <div className="flex items-center gap-4">
        <button>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2 5 5.4 5c2 0 3.4 1.1 4.1 2.2.3.4.9.4 1.1 0C11.2 6.1 12.6 5 14.6 5 18 5 19.6 8.4 18 11.7 15.5 16.4 12 21 12 21z"
              stroke="#262626"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 19l1.4-4.8A8 8 0 1110 20.6L4 19z"
              stroke="#262626"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---- Feed screen ---------------------------------------------------

function FeedScreen({
  posts,
  stories,
  expandedComments,
  onToggleComments,
  onToggleLike,
  onDoubleTapImage,
  heartPulsePostId,
  onOpenStory,
  onClose,
  myAvatar,
}: {
  posts: Post[];
  stories: StoryUser[];
  expandedComments: Record<string, boolean>;
  onToggleComments: (id: string) => void;
  onToggleLike: (id: string) => void;
  onDoubleTapImage: (id: string) => void;
  heartPulsePostId: string | null;
  onOpenStory: (index: number) => void;
  onClose: () => void;
  myAvatar: string;
}) {
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  return (
    <motion.div
      key="feed"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.12}
      onDragEnd={handleDragEnd}
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      className="absolute inset-0 z-10 bg-white flex flex-col"
    >
      <StatusBar dark />
      <Header />

      <div className="flex-1 overflow-y-auto">
        <StoryTray stories={stories} onOpenStory={onOpenStory} />

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            expanded={!!expandedComments[post.id]}
            onToggleComments={() => onToggleComments(post.id)}
            onToggleLike={() => onToggleLike(post.id)}
            onDoubleTapImage={() => onDoubleTapImage(post.id)}
            showHeartPulse={heartPulsePostId === post.id}
          />
        ))}
      </div>

      <BottomTabBar myAvatar={myAvatar} />
    </motion.div>
  );
}

// ---- Root component --------------------------------------------------

export default function InstagramApp() {
  const closeApp = usePhoneStore((s) => s.closeApp);

  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [heartPulsePostId, setHeartPulsePostId] = useState<string | null>(null);

  const toggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      )
    );
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleDoubleTapImage = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId && !p.liked ? { ...p, liked: true, likeCount: p.likeCount + 1 } : p))
    );
    setHeartPulsePostId(postId);
    setTimeout(() => setHeartPulsePostId(null), 650);
  };

  return (
    <div className="absolute inset-0 bg-white overflow-hidden">
      <FeedScreen
        posts={posts}
        stories={STORIES}
        expandedComments={expandedComments}
        onToggleComments={toggleComments}
        onToggleLike={toggleLike}
        onDoubleTapImage={handleDoubleTapImage}
        heartPulsePostId={heartPulsePostId}
        onOpenStory={setActiveStoryIndex}
        onClose={closeApp}
        myAvatar={STORIES[0]?.avatar ?? "/avatars/agetta.jpeg"}
      />

      <AnimatePresence>
        {activeStoryIndex !== null && (
          <StoryViewer
            stories={STORIES}
            index={activeStoryIndex}
            onClose={() => setActiveStoryIndex(null)}
            onChangeIndex={setActiveStoryIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
