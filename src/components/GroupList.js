import React, { useEffect, useState } from 'react';

const GroupList = () => {
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        const fetchGroups = async () => {
            const response = await fetch('/api/groups');
            const data = await response.json();
            setGroups(data);
        };
        fetchGroups();
    }, []);

    return (
        <div>
            <h2>Groups</h2>
            <ul>
                {groups.map((group) => (
                    <li key={group._id}>{group.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default GroupList;
