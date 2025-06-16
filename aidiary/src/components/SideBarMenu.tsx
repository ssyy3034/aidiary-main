import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Box,
    Divider,
} from '@mui/material';
import {
    Menu as MenuIcon,
    AccountCircle as AccountIcon,
    ChildCare as ChildCareIcon,
    Book as DiaryIcon,
    Logout as LogoutIcon,
    EmojiObjects as PersonalityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
    onLogout: () => void;
}

const SidebarMenu: React.FC<SidebarProps> = ({ onLogout }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();

    const toggleDrawer = (open: boolean) => () => {
        setDrawerOpen(open);
    };

    const menuItems = [
        { text: '캐릭터', icon: <ChildCareIcon />, path: '/character' },
        { text: '성격 생성', icon: <PersonalityIcon />, path: '/character-personality' },
        { text: '다이어리', icon: <DiaryIcon />, path: '/diary' },
        { text: '프로필', icon: <AccountIcon />, path: '/profile' },
    ];

    return (
        <>
            <AppBar position="fixed" sx={{ backgroundColor: '#fff0e6' }}>
    <Toolbar>
        <IconButton edge="start" onClick={toggleDrawer(true)} sx={{ color: '#c2675a' }}>
    <MenuIcon />
    </IconButton>
    <Typography variant="h6" sx={{ flexGrow: 1, color: '#c2675a', fontWeight: 600 }}>
    AI 산모 일기
    </Typography>
    </Toolbar>
    </AppBar>

    <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
    <List>
        {menuItems.map(({ text, icon, path }) => (
                <ListItem button key={text} onClick={() => navigate(path)}>
    <ListItemIcon>{icon}</ListItemIcon>
    <ListItemText primary={text} />
    </ListItem>
))}
    </List>
    <Divider />
    <List>
        <ListItem button onClick={onLogout}>
        <ListItemIcon><LogoutIcon /></ListItemIcon>
        <ListItemText primary="로그아웃" />
        </ListItem>
        </List>
        </Box>
        </Drawer>
        </>
);
};

export default SidebarMenu;
