import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FeedPlaceholder } from '@/features/feed/FeedPlaceholder';
import { FEEDS, FeedTabs } from '@/features/feed/FeedTabs';
import { FriendsFeed } from '@/features/feed/FriendsFeed';
import { spacing } from '@/theme';

/** Home (spec §5): horizontal swipe between Friends / FoF / Explore feeds. */
export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  return (
    <ErrorBoundary screen="Home">
      <View style={styles.container}>
        <FeedTabs
          activeIndex={activeIndex}
          onSelect={(index) => {
            setActiveIndex(index);
            pagerRef.current?.setPage(index);
          }}
        />
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={(e) => setActiveIndex(e.nativeEvent.position)}
        >
          {FEEDS.map((feed, index) => (
            <View key={feed} style={styles.page}>
              {index === 0 ? <FriendsFeed /> : <FeedPlaceholder feedName={feed} />}
            </View>
          ))}
        </PagerView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
