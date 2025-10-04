import { useState } from "react";
import { Typography, TextField, IconButton, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";

type EditableFieldProps = {
    label: string;
    value?: string | number;
    type?: "text" | "number";
    onSave: (newValue: string | number) => void;
};

export default function EditableField({
    label,
    value,
    type = "text",
    onSave,
}: EditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [fieldValue, setFieldValue] = useState(value || "");

    const handleSave = () => {
        onSave(fieldValue);
        setIsEditing(false);
    };

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                mb: 2,
                gap: 2,
            }}
        >
            <Typography
                variant="body1"
                sx={{
                    fontFamily: "Neue Machina, sans-serif",
                    letterSpacing: "0.1em",
                    minWidth: 150,
                }}
            >
                {label}:
            </Typography>

            {isEditing ? (
                <>
                    <TextField
                        fullWidth
                        size="small"
                        type={type}
                        value={fieldValue}
                        onChange={(e) => setFieldValue(e.target.value)}
                        variant="outlined" // <-- clear border
                        sx={{
                            flex: 1,
                            input: {
                                fontFamily: "Neue Machina, sans-serif",
                                letterSpacing: "0.1em",
                            },
                        }}
                    />
                    <IconButton onClick={handleSave} color="primary">
                        <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => setIsEditing(false)} color="error">
                        <CancelIcon />
                    </IconButton>
                </>
            ) : (
                <>
                    <Typography
                        sx={{
                            fontFamily: "Neue Machina, sans-serif",
                            letterSpacing: "0.1em",
                        }}
                    >
                        {value || "N/A"}
                    </Typography>
                    <IconButton onClick={() => setIsEditing(true)} size="small">
                        <EditIcon fontSize="small" />
                    </IconButton>
                </>
            )}
        </Box>
    );
}
