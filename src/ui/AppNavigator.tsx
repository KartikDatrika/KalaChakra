import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { KalaChakraDial }  from './KalaChakraDial';
import { PomodoroView }    from './pomodoro/PomodoroView';

type Tab = 'ultradian' | 'pomodoro';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ultradian', label: 'ULTRADIAN' },
  { id: 'pomodoro',  label: 'POMODORO'  },
];

export function AppNavigator() {
  const [tab, setTab] = useState<Tab>('ultradian');

  return (
    <View style={styles.root}>
      {/* Screen */}
      <View style={styles.screen}>
        {tab === 'ultradian' ? <KalaChakraDial /> : <PomodoroView />}
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <Pressable
              key={id}
              style={styles.tabItem}
              onPress={() => setTab(id)}
              hitSlop={8}
            >
              <View style={[styles.tabDot, active && styles.tabDotActive]} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screen: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.faint,
    backgroundColor: colors.bg,
  },
  tabItem: {
    alignItems: 'center',
    gap: 6,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.dim,
  },
  tabDotActive: {
    backgroundColor: colors.text,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.text,
  },
});
