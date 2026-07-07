import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Feed } from '@/features/feed/Feed';
import { FEEDS, FeedTabs } from '@/features/feed/FeedTabs';
import type { FeedScope } from '@/features/feed/useFeed';
import { spacing } from '@/theme';

const FEED_SCOPES: readonly FeedScope[] = ['friends', 'fof', 'explore'];

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
              <Feed scope={FEED_SCOPES[index] as FeedScope} />
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
