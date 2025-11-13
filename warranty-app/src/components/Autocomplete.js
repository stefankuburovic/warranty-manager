import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { TextInput, Text, Button, Portal, Dialog } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

export default function Autocomplete({
  label,
  value,
  options,
  onSelect,
  onSearch,
  getOptionLabel,
  getOptionValue,
  placeholder,
  style,
  allowCreate = false,
  onCreate,
  createDialogTitle,
  createFormFields,
  searchDebounce = 300
}) {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newItem, setNewItem] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const [inputLayout, setInputLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    // Set initial input value from selected option when options are loaded
    if (value && options.length > 0) {
      const selected = options.find(opt => getOptionValue(opt) === value);
      if (selected) {
        const label = getOptionLabel(selected);
        if (inputValue !== label) {
          setInputValue(label);
        }
      }
    } else if (!value && inputValue && options.length > 0) {
      // Clear input if value is cleared and we have options
      setInputValue('');
    }
  }, [value, options]);

  useEffect(() => {
    // Filter options based on input
    if (inputValue.trim()) {
      const filtered = options.filter(opt => {
        const label = getOptionLabel(opt).toLowerCase();
        return label.includes(inputValue.toLowerCase());
      });
      setFilteredOptions(filtered);
    } else {
      // Show all options when input is empty
      setFilteredOptions(options.slice(0, 10)); // Limit to 10 for performance
    }
  }, [inputValue, options]);

  const handleInputChange = (text) => {
    setInputValue(text);
    
    // Debounce search
    if (onSearch && text.trim()) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(text);
      }, searchDebounce);
    }
  };

  const handleSelect = (option) => {
    const optionValue = getOptionValue(option);
    const optionLabel = getOptionLabel(option);
    setInputValue(optionLabel);
    setShowSuggestions(false);
    onSelect(optionValue);
  };

  const handleCreate = async () => {
    if (!onCreate) return;
    
    setIsCreating(true);
    try {
      const result = await onCreate(newItem);
      if (result) {
        handleSelect(result);
        setShowCreateDialog(false);
        setNewItem({});
      }
    } catch (error) {
      console.error('Error creating item:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, style]}>
      <View
        ref={inputRef}
        onLayout={() => {
          inputRef.current?.measureInWindow((x, y, width, height) => {
            setInputLayout({ x, y, width, height });
          });
        }}
      >
        <TextInput
          label={label}
          value={inputValue}
          onChangeText={handleInputChange}
          onFocus={() => {
            inputRef.current?.measureInWindow((x, y, width, height) => {
              setInputLayout({ x, y, width, height });
            });
            if (inputValue.trim() || options.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow selection
            setTimeout(() => {
              setShowSuggestions(false);
              // If input doesn't match selected value, try to restore it
              if (value && options.length > 0) {
                const selected = options.find(opt => getOptionValue(opt) === value);
                if (selected && inputValue !== getOptionLabel(selected)) {
                  setInputValue(getOptionLabel(selected));
                }
              }
            }, 200);
          }}
          mode="outlined"
          placeholder={placeholder}
          style={styles.input}
          right={
            <TextInput.Icon
              icon={showSuggestions ? 'chevron-up' : 'chevron-down'}
              onPress={() => {
                if (options.length > 0) {
                  inputRef.current?.measureInWindow((x, y, width, height) => {
                    setInputLayout({ x, y, width, height });
                  });
                  setShowSuggestions(!showSuggestions);
                }
              }}
            />
          }
        />
      </View>

      <Modal
        visible={showSuggestions && (filteredOptions.length > 0 || (!inputValue.trim() && options.length > 0))}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSuggestions(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.suggestionsContainer,
                {
                  top: inputLayout.y + inputLayout.height + 4,
                  left: inputLayout.x,
                  width: inputLayout.width,
                }
              ]}
              onStartShouldSetResponder={() => true}
            >
              <ScrollView
                style={styles.suggestionsList}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {(inputValue.trim() ? filteredOptions : options.slice(0, 10)).map((item) => (
                  <TouchableOpacity
                    key={getOptionValue(item).toString()}
                    style={styles.suggestionItem}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={styles.suggestionText}>
                      {getOptionLabel(item)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showSuggestions && filteredOptions.length === 0 && inputValue.trim() && allowCreate}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSuggestions(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.suggestionsContainer,
                {
                  top: inputLayout.y + inputLayout.height + 4,
                  left: inputLayout.x,
                  width: inputLayout.width,
                }
              ]}
              onStartShouldSetResponder={() => true}
            >
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => {
                  setShowSuggestions(false);
                  setShowCreateDialog(true);
                }}
              >
                <Text style={styles.createButtonText}>
                  + Create "{inputValue}"
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {allowCreate && createFormFields && (
        <Portal>
          <Dialog
            visible={showCreateDialog}
            onDismiss={() => setShowCreateDialog(false)}
            style={styles.dialog}
          >
            <Dialog.Title>{createDialogTitle}</Dialog.Title>
            <Dialog.Content>
              {createFormFields(newItem, setNewItem)}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreate}
                loading={isCreating}
                disabled={isCreating}
              >
                Create
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1
  },
  input: {
    backgroundColor: theme.colors.surface
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  suggestionsContainer: {
    position: 'absolute',
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 200,
    elevation: 10,
    shadowColor: theme.colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  suggestionsList: {
    maxHeight: 200
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider
  },
  suggestionText: {
    color: theme.colors.text,
    fontSize: 14
  },
  createButton: {
    padding: 12,
    backgroundColor: theme.colors.primary + '10',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  createButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  dialog: {
    backgroundColor: theme.colors.surface
  }
});

