import React, { useState } from 'react';
import axios from 'axios';

const port = 5003;

function Settings({ username }) {
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage]         = useState('');

    const handleChangePassword = async () => {
        //Confirm the user is logged in before they can change their password.
        if (!username) {
            console.log(username); //Used for debugging purposes.
            setMessage('You must be logged in to change your password');
            return;
        }

        try {
            //Send the newly created password to the server-side endpoint.
            const response = await axios.put(`http://localhost:${port}/user/${username}/password`, {
                newPassword,
            });

            //Display a success/failure message to the user upon new password submission.
            setMessage(response.data.message || 'Password updated successfully!');
        } catch (error) {
            console.error('Error:', error.response?.data || error.message);
            setMessage('Failed to update password. Please try again.');
        }
    };

    //Format content for the settings UI page.
    return (
        <div>
            <h1>Settings</h1>
            <p>Logged in as: {username}</p>
            <div>
                <label>
                    New Password:
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </label>
                <button onClick={handleChangePassword}>Change Password</button>
            </div>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Settings;
