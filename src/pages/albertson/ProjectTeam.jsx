import React from 'react';
import './ProjectTeam.css';

const ProjectTeam = () => {
  const teamMembers = [
    { id: 1, name: 'John Smith', role: 'Project Manager', email: 'john.smith@albertson.com' },
    { id: 2, name: 'Sarah Johnson', role: 'Lead Developer', email: 'sarah.johnson@albertson.com' },
    { id: 3, name: 'Mike Davis', role: 'Frontend Developer', email: 'mike.davis@albertson.com' },
    { id: 4, name: 'Lisa Chen', role: 'Backend Developer', email: 'lisa.chen@albertson.com' },
    { id: 5, name: 'Tom Wilson', role: 'QA Engineer', email: 'tom.wilson@albertson.com' },
    { id: 6, name: 'Emma Brown', role: 'UI/UX Designer', email: 'emma.brown@albertson.com' }
  ];

  return (
    <div className="project-team">
      <div className="team-header">
        <h1>Albertson - Project Team</h1>
      </div>
      <div className="team-content">
        <div className="team-grid">
          {teamMembers.map(member => (
            <div key={member.id} className="team-member">
              <div className="member-avatar">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="member-info">
                <h3>{member.name}</h3>
                <p className="member-role">{member.role}</p>
                <p className="member-email">{member.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectTeam;