console.log("FED-13: JS file loaded successfully!");

async function loadCourses() {
    try {
        const response = await fetch('data/courses.json');  
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const courses = await response.json();
        return courses;
    } catch (error) {
        console.error('Failed to load course data:', error);
        throw error; 
    }
}

async function init() { 
    try {
        const courses = await loadCourses();
        console.log('Courses loaded successfully:', courses);
        console.log(`Number of courses: ${courses.length}`);
        return courses;
    } catch (error) {
        console.error('Failed to initialize app:', error);
        return []; 
    }
}
init();