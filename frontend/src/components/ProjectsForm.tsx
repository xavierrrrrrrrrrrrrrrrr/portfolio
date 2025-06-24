import React, { useEffect } from 'react';
import { Code, Plus, Trash2, ExternalLink, Github, Image } from 'lucide-react';
import { Project } from '../types/portfolio';

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

export const ProjectsForm: React.FC<ProjectsFormProps> = ({ data, onChange }) => {
  // Initialize with 3 empty projects if none exist
  useEffect(() => {
    if (data.length === 0) {
      const initialProjects = Array(3).fill(null).map(() => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name: '',
        description: '',
        technologies: [],
        githubUrl: '',
        liveUrl: '',
        imageUrl: ''
      }));
      onChange(initialProjects);
    }
  }, []);

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: '',
      description: '',
      technologies: [],
      githubUrl: '',
      liveUrl: '',
      imageUrl: ''
    };
    onChange([...data, newProject]);
  };

  const removeProject = (id: string) => {
    onChange(data.filter(project => project.id !== id));
  };

  const updateProject = (id: string, field: keyof Project, value: string | string[]) => {
    onChange(data.map(project => 
      project.id === id ? { ...project, [field]: value } : project
    ));
  };

  const updateTechnologies = (id: string, techString: string) => {
    const technologies = techString.split(',').map(tech => tech.trim()).filter(tech => tech.length > 0);
    updateProject(id, 'technologies', technologies);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Code className="w-6 h-6 text-blue-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
        </div>
        <button
          onClick={addProject}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </button>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Project Information</h3>
        <p className="text-blue-700">
          Please provide details for your projects. For each project, include:
        </p>
        <ul className="list-disc list-inside mt-2 text-blue-700 space-y-1">
          <li>Project name and technologies used</li>
          <li>A detailed description of the project</li>
          <li>GitHub repository URL</li>
          <li>Live demo URL (if available)</li>
          <li>Image URL showcasing your project</li>
        </ul>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Loading projects...</p>
        </div>
      )}

      <div className="space-y-8">
        {data.map((project, index) => (
          <div key={project.id} className="border border-gray-200 rounded-lg p-6 relative">
            <div className="absolute top-4 right-4 flex space-x-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Project {index + 1}
              </span>
              {data.length > 1 && (
                <button
                  onClick={() => removeProject(project.id)}
                  className="text-red-500 hover:text-red-700 transition-colors duration-200"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Awesome Project"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technologies *
                </label>
                <input
                  type="text"
                  value={project.technologies.join(', ')}
                  onChange={(e) => updateTechnologies(project.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="React, TypeScript, Node.js"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={project.description}
                  onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide a detailed description of what this project does, the problem it solves, key features, your role, and any challenges you overcame..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Github className="w-4 h-4 inline mr-1" />
                  GitHub URL *
                </label>
                <input
                  type="url"
                  value={project.githubUrl || ''}
                  onChange={(e) => updateProject(project.id, 'githubUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://github.com/username/project"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ExternalLink className="w-4 h-4 inline mr-1" />
                  Live Demo URL
                </label>
                <input
                  type="url"
                  value={project.liveUrl || ''}
                  onChange={(e) => updateProject(project.id, 'liveUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://myproject.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Image className="w-4 h-4 inline mr-1" />
                  Project Image URL *
                </label>
                <input
                  type="url"
                  value={project.imageUrl || ''}
                  onChange={(e) => updateProject(project.id, 'imageUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/project-image.jpg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide a URL to an image that showcases your project (screenshot, logo, etc.)
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};