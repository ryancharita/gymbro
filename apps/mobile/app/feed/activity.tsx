import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { spacing, typography, uiPatterns } from "@ironlink/shared";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { FormField } from "../../src/components/FormField";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { createAuthenticatedClient } from "../../src/lib/auth";
import { useThemeColors } from "../../src/lib/theme";
import {
  ADD_POST_COMMENT_MUTATION,
  CREATE_POST_MUTATION,
  HOME_FEED_QUERY,
  LIKE_POST_MUTATION,
  UNLIKE_POST_MUTATION,
  type FeedPost,
} from "../../src/lib/graphql";

export default function ActivityFeedScreen() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPost, setNewPost] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const colors = useThemeColors();

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
    <ScreenLayout
      title="Activity feed"
      subtitle="Updates from people you follow."
    >
      <Button label="← Back to Discover" variant="ghost" onPress={() => router.back()} />

      <FormField label="Share an update" value={newPost} onChangeText={setNewPost} multiline style={styles.postInput} />
      <Button label="Post" onPress={() => void createPost()} />

      <FlatList
        style={styles.list}
        data={posts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          loading ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>Loading...</Text>
          ) : (
            <EmptyState
              icon="🏋️"
              title="Your feed is quiet"
              subtitle="Follow athletes to see shared routines, workouts, and progress posts."
            />
          )
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.author, { color: colors.textPrimary }]}>{item.user.username ?? "athlete"}</Text>
            <Text style={[styles.content, { color: colors.textSecondary }]}>{item.content}</Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {new Date(item.createdAt).toLocaleString()} · {item.likeCount} likes · {item.commentCount} comments
            </Text>
            <View style={styles.actions}>
              <Button label={item.viewerHasLiked ? "Unlike" : "Like"} variant="ghost" onPress={() => void toggleLike(item)} />
              <Button label="View profile" variant="ghost" onPress={() => router.push(`/profile/${item.userId}`)} />
            </View>
            {(item.comments ?? []).map((comment) => (
              <Text key={comment.id} style={[styles.comment, { color: colors.textSecondary }]}>
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
  list: { marginTop: spacing.lg },
  empty: { ...typography.body, textAlign: "center", marginTop: spacing.xl },
  card: {
    ...uiPatterns.card,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  author: { ...typography.label },
  content: { ...typography.body },
  meta: { ...typography.caption },
  actions: { flexDirection: "row", gap: spacing.sm },
  comment: { ...typography.caption },
});
