        const showAddHabitBtn = document.getElementById('showAddHabitBtn');
    const habitModal = document.getElementById('habitModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modalTitle');
    const habitInput = document.getElementById('habitInput');
    const saveHabitBtn = document.getElementById('saveHabitBtn');
    const habitsList = document.getElementById('habitsList');
    const trackerHeader = document.getElementById('trackerHeader');
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const colorPalette = document.getElementById('colorPalette');
    const resetAllBtn = document.getElementById('resetAllBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const moonIcon = document.getElementById('moonIcon');
    const sunIcon = document.getElementById('sunIcon');
    // New variable for the copy button
    const copyPreviousMonthBtn = document.getElementById('copyPreviousMonthBtn');

    // New variables for the settings menu
    const settingsToggleBtn = document.getElementById('settingsToggleBtn');
    const settingsMenu = document.getElementById('settingsMenu');

    // New: Available colors and selected color state
    const availableColors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-gray-900'];
    let selectedColor = availableColors[0]; // Default selected color
    let editingHabit = null; // Stores the habit element being edited

    // --- Dark Mode Functions ---
    function toggleDarkMode() {
        const html = document.documentElement;
        if (html.getAttribute('data-mode') === 'dark') {
            html.removeAttribute('data-mode');
            localStorage.setItem('theme', 'light');
            moonIcon.classList.remove('hidden');
            sunIcon.classList.add('hidden');
        } else {
            html.setAttribute('data-mode', 'dark');
            localStorage.setItem('theme', 'dark');
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        }
    }

    function applySavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-mode', 'dark');
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            document.documentElement.removeAttribute('data-mode');
            moonIcon.classList.remove('hidden');
            sunIcon.classList.add('hidden');
        }
    }

    // Event listeners for the modal
    showAddHabitBtn.addEventListener('click', () => {
        editingHabit = null; // Reset editing state
        modalTitle.textContent = 'Create New Habit';
        saveHabitBtn.textContent = 'Add Habit';
        habitInput.value = '';
        selectedColor = availableColors[0];
        createColorPalette();
        habitModal.style.display = 'flex';
        habitInput.focus();
    });
    closeModalBtn.addEventListener('click', () => {
        habitModal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target == habitModal) {
            habitModal.style.display = 'none';
        }
        // Close all habit menus when clicking anywhere else
        document.querySelectorAll('.habit-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    });
    saveHabitBtn.addEventListener('click', () => {
        if (editingHabit) {
            updateHabit();
        } else {
            addHabit();
        }
    });
    habitInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (editingHabit) {
                updateHabit();
            } else {
                addHabit();
            }
        }
    });

    // Event listeners for month and year dropdowns
    monthSelect.addEventListener('change', () => {
        renderCalendar();
        loadState();
    });
    yearSelect.addEventListener('change', () => {
        renderCalendar();
        loadState();
    });
    resetAllBtn.addEventListener('click', resetAllData);
    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    // New Event Listener for the copy button
    copyPreviousMonthBtn.addEventListener('click', copyHabitsFromPreviousMonth);
    
    // New: Event listener for the settings button
    settingsToggleBtn.addEventListener('click', (event) => {
      settingsMenu.classList.toggle('hidden');
      // Prevent the click from propagating to the window listener
      event.stopPropagation();
    });
    
    // New: Event listener to close the menu when clicking outside of it
    window.addEventListener('click', (event) => {
      if (!settingsMenu.contains(event.target) && !settingsToggleBtn.contains(event.target)) {
        settingsMenu.classList.add('hidden');
      }
    });

    // --- Persistent State Functions ---
    function getStorageKey() {
        return `trackerState-${monthSelect.value}-${yearSelect.value}`;
    }
    
    // New helper function to get previous month's storage key
    function getPreviousMonthKey() {
        const currentMonthIndex = monthSelect.selectedIndex;
        const currentYear = parseInt(yearSelect.value);
        let prevMonthIndex, prevYear;

        if (currentMonthIndex === 0) { // January
            prevMonthIndex = 11; // December
            prevYear = currentYear - 1;
        } else {
            prevMonthIndex = currentMonthIndex - 1;
            prevYear = currentYear;
        }

        const prevMonthName = monthSelect.options[prevMonthIndex].value;
        return `trackerState-${prevMonthName}-${prevYear}`;
    }

    function saveState() {
        const habits = [];
        habitsList.querySelectorAll('.tracker-grid').forEach(habitElement => {
            const habitName = habitElement.querySelector('.habit-name').textContent;
            const defaultColor = habitElement.dataset.defaultColor;
            const days = [];
            habitElement.querySelectorAll('.day-square').forEach(square => {
                const colorClass = Array.from(square.classList).find(cls => cls.startsWith('bg-'));
                days.push(colorClass);
            });
            habits.push({ name: habitName, defaultColor, days });
        });
        localStorage.setItem(getStorageKey(), JSON.stringify(habits));
    }

    function loadState() {
        const savedState = localStorage.getItem(getStorageKey());

        // Clear existing habits
        habitsList.innerHTML = '';

        const daysInMonth = new Date(yearSelect.value, monthSelect.selectedIndex + 1, 0).getDate();

        if (savedState) {
            const habits = JSON.parse(savedState);
            habits.forEach(habitData => {
                // Adjust habit data if the number of days has changed since it was saved
                if (habitData.days.length !== daysInMonth) {
                    habitData.days.length = daysInMonth; // Truncate or extend the array
                    habitData.days.fill('bg-gray-200', habitData.days.length); // Fill new days
                }
                createHabitRow(habitData.name, habitData.defaultColor, habitData.days);
            });
        }
    }
    
function createHabitRow(name, defaultColor, days) {
    const habitElement = document.createElement('div');
    habitElement.classList.add('tracker-grid');
    habitElement.dataset.defaultColor = defaultColor;

    const habitNameDiv = document.createElement('div');
    // Change: Use flexbox to align items and space them out
    habitNameDiv.classList.add('flex', 'items-center', 'justify-between', 'relative'); 

    // New: Container for the buttons on the right
    const controlButtonsContainer = document.createElement('div');
    controlButtonsContainer.classList.add('flex', 'items-center', 'space-x-1');

    // New: Pop-up menu button
    const menuBtn = document.createElement('button');
    menuBtn.classList.add('text-gray-400', 'hover:text-gray-600', 'p-1', 'transition-colors', 'w-5', 'h-5');
    menuBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-full h-full">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>`;
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        document.querySelectorAll('.habit-menu').forEach(menu => {
            if (menu !== habitElement.querySelector('.habit-menu')) {
                menu.classList.add('hidden');
            }
        });
        habitElement.querySelector('.habit-menu').classList.toggle('hidden');
    });
    // Append the menu button to the new container
    controlButtonsContainer.appendChild(menuBtn);

    // New: Pop-up menu (this remains unchanged, but its position is relative to its parent)
    const menu = document.createElement('div');
    menu.classList.add('habit-menu', 'absolute', 'right-10', 'top-full', 'mt-1', 'bg-white', 'dark:bg-gray-700', 'rounded-lg', 'shadow-lg', 'border', 'border-gray-200', 'dark:border-gray-600', 'py-1', 'z-30', 'hidden');

    // Edit button inside the menu (remains unchanged)
    const editBtn = document.createElement('button');
    editBtn.classList.add('flex', 'items-center', 'w-full', 'px-4', 'py-2', 'text-sm', 'text-gray-700', 'dark:text-white', 'hover:bg-gray-100', 'dark:hover:bg-gray-600', 'transition-colors');
    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg> Edit`;
    editBtn.addEventListener('click', () => showEditModal(habitElement));
    menu.appendChild(editBtn);

    // Remove button inside the menu (remains unchanged)
    const removeBtn = document.createElement('button');
    removeBtn.classList.add('flex', 'items-center', 'w-full', 'px-4', 'py-2', 'text-sm', 'text-red-500', 'hover:bg-gray-100', 'dark:hover:bg-gray-600', 'transition-colors');
    removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m-1.022.165L5.674 19.673a2.25 2.25 0 002.244 2.077h6.812a2.25 2.25 0 002.244-2.077L19.563 5.79m-4.075 0V4.625c0-1.243-1.007-2.25-2.25-2.25h-2.5c-1.243 0-2.25 1.007-2.25 2.25v1.165m1.5 0h-3.75" />
    </svg> Remove`;
    removeBtn.addEventListener('click', (event) => {
        if (window.confirm('Are you sure you want to remove this habit?')) {
            habitElement.remove();
            saveState();
        }
    });
    menu.appendChild(removeBtn);
    
    // Append the menu to the control buttons container, as it is a pop-up and its position is relative to its parent
    controlButtonsContainer.appendChild(menu);

    // Habits name container on the left
    const habitNameParagraph = document.createElement('p');
    habitNameParagraph.classList.add('habit-name', 'text-base', 'font-semibold', 'text-gray-700', 'truncate'); 
    habitNameParagraph.textContent = name;
    
    // New: Move Up Button (added to the controlButtonsContainer)
    const moveUpBtn = document.createElement('button');
    moveUpBtn.classList.add('text-gray-400', 'hover:text-gray-600', 'p-1', 'transition-colors', 'w-5', 'h-5');
    moveUpBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-full h-full">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>`;
    moveUpBtn.addEventListener('click', () => moveHabitRow(habitElement, -1));
    controlButtonsContainer.appendChild(moveUpBtn);

    // New: Move Down Button (added to the controlButtonsContainer)
    const moveDownBtn = document.createElement('button');
    moveDownBtn.classList.add('text-gray-400', 'hover:text-gray-600', 'p-1', 'transition-colors', 'w-5', 'h-5');
    moveDownBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-full h-full">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>`;
    moveDownBtn.addEventListener('click', () => moveHabitRow(habitElement, 1));
    controlButtonsContainer.appendChild(moveDownBtn);
    
    // Append the habit name and the new button container to the habitNameDiv
    habitNameDiv.appendChild(habitNameParagraph);
    habitNameDiv.appendChild(controlButtonsContainer);
    
    // Append the final div to the habit element
    habitElement.appendChild(habitNameDiv);

    const daysInMonth = new Date(yearSelect.value, monthSelect.selectedIndex + 1, 0).getDate();

    for (let i = 0; i < daysInMonth; i++) {
        const daySquare = document.createElement('div');
        daySquare.classList.add('day-square', days[i] || 'bg-gray-200');
        daySquare.dataset.day = i + 1;
        daySquare.addEventListener('click', toggleColor);
        habitElement.appendChild(daySquare);
    }
    habitsList.appendChild(habitElement);
}

    // New: Function to show the edit modal
    function showEditModal(habitElement) {
        editingHabit = habitElement; // Set the habit being edited
        modalTitle.textContent = 'Edit Habit';
        saveHabitBtn.textContent = 'Save Changes';

        const habitName = habitElement.querySelector('.habit-name').textContent;
        const habitColor = habitElement.dataset.defaultColor;

        habitInput.value = habitName;
        selectedColor = habitColor;
        createColorPalette();
        
        habitModal.style.display = 'flex';
        habitInput.focus();
    }
    
    // New: Function to update an existing habit
    function updateHabit() {
        const newName = habitInput.value.trim();
        if (newName === '') {
            alert('Please enter a habit name.');
            return;
        }

        // Update the habit's name
        editingHabit.querySelector('.habit-name').textContent = newName;

        // Update the habit's color
        const oldColor = editingHabit.dataset.defaultColor;
        editingHabit.dataset.defaultColor = selectedColor;
        editingHabit.querySelectorAll('.day-square').forEach(square => {
            if (square.classList.contains(oldColor)) {
                square.classList.remove(oldColor);
                square.classList.add(selectedColor);
            }
        });

        // Hide the modal and save state
        habitModal.style.display = 'none';
        saveState();
    }
    
    // New: Function to move a habit row up or down
    function moveHabitRow(row, direction) {
        const currentHabits = Array.from(habitsList.children);
        const currentIndex = currentHabits.indexOf(row);
        const newIndex = currentIndex + direction;

        if (newIndex >= 0 && newIndex < currentHabits.length) {
            // Remove the row from its current position
            habitsList.removeChild(row);
            
            // Insert it at the new position
            if (direction === -1) {
                // Moving up
                habitsList.insertBefore(row, currentHabits[newIndex]);
            } else {
                // Moving down
                habitsList.insertBefore(row, currentHabits[newIndex].nextSibling);
            }
            saveState();
        }
    }

    // New: Create the color selection palette
    function createColorPalette() {
        colorPalette.innerHTML = ''; // Clear existing palette
        availableColors.forEach(colorClass => {
            const colorButton = document.createElement('button');
            colorButton.type = 'button';
            colorButton.classList.add('color-circle', colorClass);
            
            // Set the default selection
            if (colorClass === selectedColor) {
                colorButton.classList.add('selected');
                colorButton.innerHTML = `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`;
            }

            colorButton.addEventListener('click', () => {
                // Remove selected class from all buttons
                document.querySelectorAll('.color-circle').forEach(btn => {
                    btn.classList.remove('selected');
                    btn.innerHTML = ''; // Remove checkmark
                });

                // Add selected class to the clicked button
                colorButton.classList.add('selected');
                colorButton.innerHTML = `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`;
                selectedColor = colorClass; // Update the global selected color
            });
            colorPalette.appendChild(colorButton);
        });
    }

    // --- Other Functions ---
    function resetAllData() {
        if (window.confirm('Are you sure you want to delete all habits for this month? This cannot be undone.')) {
            localStorage.removeItem(getStorageKey());
            loadState();
        }
    }
    
    // New Function to copy habits from the previous month
    function copyHabitsFromPreviousMonth() {
        const previousMonthKey = getPreviousMonthKey();
        const previousMonthData = localStorage.getItem(previousMonthKey);
        
        if (!previousMonthData) {
            alert('No habits found for the previous month.');
            return;
        }
        
        if (habitsList.childElementCount > 0 && !window.confirm('Copying habits will overwrite all habits for the current month. Are you sure?')) {
            return;
        }

        const previousHabits = JSON.parse(previousMonthData);
        
        const daysInMonth = new Date(yearSelect.value, monthSelect.selectedIndex + 1, 0).getDate();

        // Create a new array with only the habit names and colors, resetting the days
        const newHabits = previousHabits.map(habit => {
            const emptyDays = Array(daysInMonth).fill('bg-gray-200');
            return {
                name: habit.name,
                defaultColor: habit.defaultColor,
                days: emptyDays
            };
        });

        localStorage.setItem(getStorageKey(), JSON.stringify(newHabits));
        loadState();
        settingsMenu.classList.add('hidden'); // Close the menu after the action
    }


    function populateYears() {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelect.appendChild(option);
        }
        yearSelect.value = currentYear;
    }

    function renderCalendar() {
        // Clear previous day numbers and update grid columns
        trackerHeader.querySelectorAll('.day-number').forEach(e => e.remove());
        habitsList.querySelectorAll('.tracker-grid').forEach(e => e.remove());

        const selectedYear = parseInt(yearSelect.value);
        const selectedMonthIndex = monthSelect.selectedIndex;
        const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
        const currentDate = new Date();
        const currentDay = currentDate.getDate();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Update the grid template columns to be dynamic
        trackerHeader.style.gridTemplateColumns = `minmax(140px, 1fr) repeat(${daysInMonth}, 1.9rem)`;
        habitsList.querySelectorAll('.tracker-grid').forEach(grid => {
            grid.style.gridTemplateColumns = `minmax(140px, 1fr) repeat(${daysInMonth}, 1.9rem)`;
        });

        for (let i = 1; i <= daysInMonth; i++) {
            const dayNumberDiv = document.createElement('div');
            dayNumberDiv.classList.add('day-number');
            dayNumberDiv.textContent = i;
            
            // Mark the current day with a circle
            if (i === currentDay && selectedMonthIndex === currentMonth && selectedYear === currentYear) {
                dayNumberDiv.classList.add('current-day');
            }

            trackerHeader.appendChild(dayNumberDiv);
        }
        loadState();
    }

    function addHabit() {
        const habitName = habitInput.value.trim();
        if (habitName === '') {
            alert('Please enter a habit.');
            return;
        }

        const daysInMonth = new Date(yearSelect.value, monthSelect.selectedIndex + 1, 0).getDate();
        const days = Array(daysInMonth).fill('bg-gray-200');
        createHabitRow(habitName, selectedColor, days);

        habitInput.value = '';
        habitModal.style.display = 'none';
        saveState();
    }

    function toggleColor(event) {
        const square = event.target;
        const habitRow = square.closest('.tracker-grid');
        const defaultColor = habitRow.dataset.defaultColor;

        if (square.classList.contains('bg-gray-200')) {
            square.classList.remove('bg-gray-200');
            square.classList.add(defaultColor);
        } else {
            square.classList.remove(defaultColor);
            square.classList.add('bg-gray-200');
        }
        saveState();
    }

    // --- Export/Import Functions ---
    function exportData() {
        const savedState = localStorage.getItem(getStorageKey());
        if (!savedState || JSON.parse(savedState).length === 0) {
            alert('No data to export for this month.');
            return;
        }

        const habits = JSON.parse(savedState);
        const daysInMonth = new Date(yearSelect.value, monthSelect.selectedIndex + 1, 0).getDate();
        const daysHeader = Array.from({ length: daysInMonth }, (_, i) => `Day_${i + 1}`).join(',');
        const csvHeader = `Habit_Name,Default_Color,${daysHeader}\n`;

        const csvRows = habits.map(habit => {
            const dayData = habit.days.map(day => day).join(',');
            return `"${habit.name.replace(/"/g, '""')}","${habit.defaultColor}",${dayData}`;
        });

        const csvContent = csvHeader + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `habit_tracker_data_${monthSelect.value}-${yearSelect.value}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (habitsList.childElementCount > 0 && !window.confirm('Importing data will overwrite all habits for the current month. Are you sure?')) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                const rows = csvContent.trim().split('\n');
                const importedHabits = [];

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i].split(',');
                    const name = row[0].replace(/"/g, '');
                    const defaultColor = row[1].replace(/"/g, '');
                    const days = row.slice(2);

                    if (name && defaultColor) {
                        importedHabits.push({ name, defaultColor, days });
                    }
                }

                if (importedHabits.length > 0) {
                    localStorage.setItem(getStorageKey(), JSON.stringify(importedHabits));
                    renderCalendar();
                } else {
                    alert('No valid habit data found in the CSV file.');
                }
            } catch (error) {
                alert('Failed to parse the CSV file. Please check the file format.');
                console.error('Import error:', error);
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }

    // Initialize on page load
    applySavedTheme();
    populateYears();
    const currentDate = new Date();
    monthSelect.value = currentDate.toLocaleString('default', { month: 'long' });
    yearSelect.value = currentDate.getFullYear();
    renderCalendar();
    createColorPalette(); // New: Initialize the color palette
