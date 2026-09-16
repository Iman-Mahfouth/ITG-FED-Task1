console.log("FED-13: JS file loaded successfully!");
let courses = []; 

async function loadCourses() {
    try {
        const response = await fetch('data/courses.json');  
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        courses = await response.json();
        console.log('Courses loaded successfully:', courses);
        console.log(`Number of courses: ${courses.length}`);

    } catch (error) {
        console.error('Failed to load course data:', error);
    }
}

loadCourses();