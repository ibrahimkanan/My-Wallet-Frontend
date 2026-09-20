import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Category } from '../../types/models';

interface CategoryListItemProps {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}

export function CategoryListItem({
  category,
  onEdit,
  onDelete,
}: CategoryListItemProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const isExpense = category.type === 'expense';
  const badgeColor = isExpense ? theme.expense : theme.income;
  const iconName = (category.icon as any) || 'pricetag-outline';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        Shadows.card,
      ]}
    >
      <View style={styles.cardMainRow}>
        <View style={styles.cardLeftCol}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: `${badgeColor}15` },
            ]}
          >
            <Ionicons name={iconName} size={22} color={badgeColor} />
          </View>
          <View style={styles.textCol}>
            <Text
              style={[
                Typography.headline,
                styles.name,
                { color: theme.textPrimary },
              ]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${badgeColor}12` },
              ]}
            >
              <Text
                style={[
                  Typography.caption,
                  { color: badgeColor, fontWeight: '700' },
                ]}
              >
                {isExpense ? Strings.home.typeExpense : Strings.home.typeIncome}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onEdit}
            style={[
              styles.actionBtn,
              { backgroundColor: theme.surfaceSubtle },
            ]}
            accessibilityLabel={Strings.common.edit}
          >
            <Ionicons name="pencil" size={16} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onDelete}
            style={[
              styles.actionBtn,
              { backgroundColor: `${theme.expense}15` },
            ]}
            accessibilityLabel={Strings.common.delete}
          >
            <Ionicons name="trash-outline" size={16} color={theme.expense} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingEnd: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  textCol: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
