import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Text } from 'react-native';
import { Portal, Modal, Button, Divider, Chip } from 'react-native-paper';
import { Workout } from '../types/workout';
import { workoutService } from '../services/workoutService';

// Fonts
import { fonts } from '../styles/fonts';

interface SaveTemplateModalProps {
  visible: boolean;
  onDismiss: () => void;
  workout: Workout | null;
  onSuccess: () => void;
}

// Difficulty options
const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

// Common workout splits
const SPLIT_OPTIONS = [
  'Full Body',
  'Upper/Lower',
  'Push/Pull/Legs',
  'Chest/Back',
  'Arms/Shoulders',
  'Cardio',
  'Custom'
];

// Workout categories
const CATEGORY_OPTIONS = [
  'Strength',
  'Hypertrophy',
  'Endurance',
  'Power',
  'Calisthenics',
  'Cardio',
  'Mobility',
  'Recovery'
];

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  visible,
  onDismiss,
  workout,
  onSuccess
}) => {
  // Template form state
  const [templateName, setTemplateName] = useState(workout?.name || '');
  const [templateDescription, setTemplateDescription] = useState(workout?.notes || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedSplit, setSelectedSplit] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle saving the template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError('Please provide a name for your template');
      return;
    }

    if (!workout) {
      setError('No workout data available');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await workoutService.saveWorkoutTemplate(workout, {
        name: templateName.trim(),
        description: templateDescription.trim(),
        category: selectedCategory || undefined,
        split: selectedSplit || undefined,
        difficulty: selectedDifficulty || undefined,
        tags: tags.length > 0 ? tags : undefined
      });

      // Reset form
      setTemplateName('');
      setTemplateDescription('');
      setSelectedDifficulty(null);
      setSelectedSplit(null);
      setSelectedCategory(null);
      setTags([]);
      setTagInput('');

      // Notify parent of success
      onSuccess();
      
      // Close modal
      onDismiss();
    } catch (err) {
      setError('Failed to save template. Please try again.');
      console.error('Error saving template:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a tag
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.modalTitle}>Save as Template</Text>
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Template Name (required)"
          value={templateName}
          onChangeText={setTemplateName}
        />
        
        <TextInput
          style={[styles.input, styles.textareaInput]}
          placeholder="Description (optional)"
          value={templateDescription}
          onChangeText={setTemplateDescription}
          multiline
          numberOfLines={3}
        />
        
        <Text style={styles.sectionTitle}>Difficulty</Text>
        <View style={styles.optionsContainer}>
          {DIFFICULTY_OPTIONS.map((difficulty) => (
            <Chip
              key={difficulty}
              selected={selectedDifficulty === difficulty}
              onPress={() => setSelectedDifficulty(
                selectedDifficulty === difficulty ? null : difficulty
              )}
              style={[
                styles.chip,
                selectedDifficulty === difficulty && styles.selectedChip
              ]}
              textStyle={selectedDifficulty === difficulty ? styles.selectedChipText : undefined}
            >
              {difficulty}
            </Chip>
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Workout Split</Text>
        <View style={styles.optionsContainer}>
          {SPLIT_OPTIONS.map((split) => (
            <Chip
              key={split}
              selected={selectedSplit === split}
              onPress={() => setSelectedSplit(
                selectedSplit === split ? null : split
              )}
              style={[
                styles.chip,
                selectedSplit === split && styles.selectedChip
              ]}
              textStyle={selectedSplit === split ? styles.selectedChipText : undefined}
            >
              {split}
            </Chip>
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.optionsContainer}>
          {CATEGORY_OPTIONS.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(
                selectedCategory === category ? null : category
              )}
              style={[
                styles.chip,
                selectedCategory === category && styles.selectedChip
              ]}
              textStyle={selectedCategory === category ? styles.selectedChipText : undefined}
            >
              {category}
            </Chip>
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Tags</Text>
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            placeholder="Add tag"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
          />
          <Button
            mode="contained"
            onPress={handleAddTag}
            disabled={!tagInput.trim()}
            style={styles.tagButton}
          >
            Add
          </Button>
        </View>
        
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                onClose={() => handleRemoveTag(tag)}
                style={styles.tagChip}
              >
                {tag}
              </Chip>
            ))}
          </View>
        )}
        
        <Divider style={styles.divider} />
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            onPress={onDismiss} 
            style={styles.button}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSaveTemplate} 
            style={styles.button}
            loading={loading}
            disabled={loading || !templateName.trim()}
          >
            Save Template
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#111827',
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 16,
    marginBottom: 16,
  },
  textareaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedChip: {
    backgroundColor: '#4F46E5',
  },
  selectedChipText: {
    color: '#FFFFFF',
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontFamily: fonts.regular,
    fontSize: 16,
    marginRight: 8,
  },
  tagButton: {
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#EEF2FF',
  },
  divider: {
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    minWidth: 100,
  },
});

export default SaveTemplateModal;