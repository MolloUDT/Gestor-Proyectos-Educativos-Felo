import fs from 'fs';

function replaceInFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    content = content.replace(/Gestión de Alumnos/g, "Gestión de Estudiantes");
    content = content.replace(/"Alumno"/g, '"Estudiante"');
    content = content.replace(/"Alumnos"/g, '"Estudiantes"');
    content = content.replace(/al alumno/g, "al estudiante");
    content = content.replace(/el alumno/g, "el estudiante");
    content = content.replace(/cada alumno/g, "cada estudiante");
    content = content.replace(/un alumno/g, "un estudiante");
    content = content.replace(/alumnos/g, "estudiantes");
    content = content.replace(/Alumnos/g, "Estudiantes");
    content = content.replace(/Alumno/g, "Estudiante");
    content = content.replace(/Alumnado integrante/g, "Estudiantes integrantes");
    
    fs.writeFileSync(filepath, content, 'utf8');
}

replaceInFile('translations.ts');
replaceInFile('components/ProfileModal.tsx');
replaceInFile('components/Dashboard.tsx');
replaceInFile('components/DatabaseManagement.tsx');
console.log("Done");
