async function fetchCourses() {
    const response = await fetch('data/courses.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}