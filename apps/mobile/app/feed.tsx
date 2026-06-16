import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Button } from "../src/components/Button";
import { FormField } from "../src/components/FormField";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { createAuthenticatedClient } from "../src/lib/auth";
import {
  ADD_POST_COMMENT_MUTATION,
  CREATE_POST_MUTATION,
  HOME_FEED_QUERY,
  LIKE_POST_MUTATION,
  UNLIKE_POST_MUTATION,
  type FeedPost,
} from "../src/lib/graphql";

export default function FeedScreen() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPost, setNewPost] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const loadFeed = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const data = await client.request<{ homeFeed: FeedPost[] }>(HOME_FEED_QUERY, {
        limit: 30,
        offset: 0,
      });
      setPosts(data.homeFeed);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useFocusEffect(
    useCallback(() => {
      void loadFeed();
    }, [loadFeed]),
  );

  const createPost = async () => {
    if (!newPost.trim()) return;
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      await client.request(CREATE_POST_MUTATION, { input: { content: newPost.trim() } });
      setNewPost("");
      await loadFeed();
    } catch (err) {
      Alert.alert("Could not post", err instanceof Error ? err.message : "Try again");
    }
  };

  const toggleLike = async (post: FeedPost) => {
    const client = await createAuthenticatedClient(getTokenRef.current);
    if (post.viewerHasLiked) {
      await client.request(UNLIKE_POST_MUTATION, { postId: post.id });
    } else {
      await client.request(LIKE_POST_MUTATION, { postId: post.id });
    }
    await loadFeed();
  };

  const addComment = async (postId: string) => {
    const content = (commentDrafts[postId] ?? "").trim();
    if (!content) return;
    const client = await createAuthenticatedClient(getTokenRef.current);
    await client.request(ADD_POST_COMMENT_MUTATION, { postId, content });
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    await loadFeed();
  };

  return (
    <ScreenLayout title="Home feed" subtitle="Chronological updates from people you follow.">
      <FormField label="Share an update" value={newPost} onChangeText={setNewPost} multiline style={styles.postInput} />
      <Button label="Post" onPress={() => void createPost()} />

      <FlatList
        style={styles.list}
        data={posts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? "Loading..." : "Follow people to populate your feed."}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.author}>{item.user.username ?? "athlete"}</Text>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.meta}>
              {new Date(item.createdAt).toLocaleString()} · {item.likeCount} likes · {item.commentCount} comments
            </Text>
            <View style={styles.actions}>
              <Button label={item.viewerHasLiked ? "Unlike" : "Like"} variant="ghost" onPress={() => void toggleLike(item)} />
              <Button label="View profile" variant="ghost" onPress={() => router.push(`/profile/${item.userId}`)} />
            </View>
            {(item.comments ?? []).map((comment) => (
              <Text key={comment.id} style={styles.comment}>
                {(comment.user.username ?? "athlete") + ": " + comment.content}
              </Text>
            ))}
            <FormField
              label="Add comment"
              value={commentDrafts[item.id] ?? ""}
              onChangeText={(value) => setCommentDrafts((current) => ({ ...current, [item.id]: value }))}
            />
            <Button label="Comment" variant="secondary" onPress={() => void addComment(item.id)} />
          </View>
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  postInput: { minHeight: 80, textAlignVertical: "top" },
  list: { marginTop: 16 },
  empty: { color: "#a3a3a3", textAlign: "center", marginTop: 24 },
  card: {
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  author: { color: "#fff", fontWeight: "700" },
  content: { color: "#e5e5e5" },
  meta: { color: "#a3a3a3", fontSize: 12 },
  actions: { flexDirection: "row", gap: 8 },
  comment: { color: "#d4d4d4", fontSize: 13 },
});
