const { Client } = require("../models/client");

exports.addClient = async (req, res) => {
    try {
        const { clientId } = req.body;
        const { vendorId } = req.params;

        // Find the client record for the given vendor
        const clientRecord = await Client.findOne({ vendorId });

        if (!clientRecord) {
            // If no client record exists, create a new one
            const newClientRecord = new Client({
                vendorId,
                clients: [clientId],
            });

            await newClientRecord.save();
            res.status(201).json({
                success: true,
                message: "User added to clients array",
            });
        } else {
            // If client record exists, check if the user is already in the clients array
            if (!clientRecord.clients.includes(clientId)) {
                // If not, add the user to the clients array
                clientRecord.clients.push(clientId);
                await clientRecord.save();
                res.status(200).json({
                    success: true,
                    message: "User added to clients array",
                });
            } else {
                res.status(200).json({
                    success: false,
                    message: "User already in clients array",
                });
            }
        }
    } catch (error) {
        console.error("Error adding client:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.getClientsForVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;

        // Find the client record for the given vendor
        const clientRecord = await Client.findOne({ vendorId });

        if (!clientRecord) {
            res.status(404).json({
                success: false,
                message: "Client record not found for the vendor",
            });
        } else {
            // Return the clients array for the vendor
            res.status(200).json({
                success: true,
                clients: clientRecord.clients,
            });
        }
    } catch (error) {
        console.error("Error getting clients:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
