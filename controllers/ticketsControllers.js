const User = require('../models').users;
const Notify = require('../models').notifications
const Transfer = require('../models').transfers
const path = require('path')
const slug = require('slug')
const Messages = require('../models').messages
const fs = require('fs')
const sendMail = require('../emails/mailConfig');
const { TicketExcludes } = require('../utils/utils');
const Ticket = require('../models').tickets




exports.createTicket = async (req, res) => {
    try {
        const { message, subject } = req.body
        const user = req.user
        if (!message || !subject) return res.json({ status: 404, msg: "Incomplete request" })
        const findAcc = await User.findOne({ where: { id: user } })
        if (!findAcc) return res.json({ starus: 404, msg: 'User not found' })
        if (req?.files) {
            const image = req?.files?.image;
            let imageName;

            if (image) {
                if (image.size >= 1000000) return res.json({ status: 404, msg: `Cannot upload up to 1MB` });
                if (!image.mimetype.startsWith('image/')) return res.json({ status: 400, msg: `Invalid image format (jpg, jpeg, png, svg, gif, webp)` });
            }

            const filepath = `./public/tickets/`;
            if (!fs.existsSync(filepath)) {
                fs.mkdirSync(filepath, { recursive: true });
            }
            const files = fs.readdirSync(filepath);
            const nextFileNumber = files.length + 1;
            imageName = `${slug(findAcc.firstname)}-ticket-${nextFileNumber}.jpg`;

            const ticket = await Ticket.create({ message, subject, image: imageName, userid: findAcc.id })

            await image.mv(path.join(filepath, imageName));

            return res.json({ status: 200, msg: 'Ticket successfully created', data: ticket })

        }
        if (!req?.files) {
            const ticket = await Ticket.create({ message, subject, userid: findAcc.id })
            return res.json({ status: 200, msg: 'Ticket successfully created', data: ticket })
        }

    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.getOneTicketMessages = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) return res.json({ status: 404, msg: 'Ticket ID missing' })
        const user = req.user
        const findTicketMessages = await Ticket.findOne({
            where: { id, userid: user },
            include: [
                {
                    model: Messages, as: 'ticketmessages',
                },
                {
                    model: User, as: 'usertickets',
                    attributes: { exclude: TicketExcludes }
                }
            ]
        })
        if (!findTicketMessages) return res.json({ status: 404, msg: 'Ticket not found' })
        return res.json({ status: 200, msg: 'Ticket messages fetched successfully', data: findTicketMessages })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}
exports.getOneTicketMessagesAdmin = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) return res.json({ status: 404, msg: 'Ticket ID missing' })
        const user = req.user
        const findTicketMessages = await Ticket.findOne({
            where: { id, adminid: user },
            include: [
                {
                    model: Messages, as: 'ticketmessages',
                },
                {
                    model: User, as: 'usertickets',
                    attributes: { exclude: TicketExcludes }
                }
            ]
        })
        if (!findTicketMessages) return res.json({ status: 404, msg: 'Ticket not found' })
        return res.json({ status: 200, msg: 'Ticket messages fetched successfully', data: findTicketMessages })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.getAllActiveTickets = async (req, res) => {
    try {
        const user = req.user
        const findTickets = await Ticket.findAll({ where: { status: 'active', userid: user } })
        if (!findTickets) return res.json({ status: 404, msg: 'Ticket not found' })
        return res.json({ status: 200, msg: 'Ticket fetched successfully', data: findTickets })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}
exports.getAllClosedTickets = async (req, res) => {
    try {
        const user = req.user
        const findTickets = await Ticket.findAll({ where: { status: 'closed', userid: user } })
        if (!findTickets) return res.json({ status: 404, msg: 'Ticket not found' })
        return res.json({ status: 200, msg: 'Ticket fetched successfully', data: findTickets })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.createMessageAdmin = async (req, res) => {
    try {
        const { id, message } = req.body
        const user = req.user
        if (!id || !message) return res.json({ status: 404, msg: 'Incomplete request to send message' })

        const findreceiver = await User.findOne({ where: { id: user, role: 'admin' } })
        if (!findreceiver) return res.json({ status: 404, msg: "Unauthorized access to this route" })

        const findTicketId = await Ticket.findOne({ where: { id } })
        if (!findTicketId) return res.json({ status: 404, msg: "ID not found" })

        const findsender = await User.findOne({ where: { id: findTicketId.userid } })
        if (!findsender) return res.json({ status: 404, msg: "sender not found" })

        const msg = await Messages.create({
            message,
            sender: findreceiver.id,
            ticketid: id
        })

        findTicketId.adminid = findreceiver.id
        findTicketId.joined = 'true'
        await findTicketId.save()

        await Notify.create({
            type: 'Ticket Notice',
            message: `Hi, an admin has joined your ticket with the ID of ${findTicketId.id}. Kindly goto to tickets section under active tickets to view more details.`,
            user: findsender.id
        })

        return res.json({ status: 200, msg: 'message sent' })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.sendMessage = async (req, res) => {
    try {
        const { id, message } = req.body
        const user = req.user
        if (!id || !message) return res.json({ status: 404, msg: 'Incomplete request to send message' })
        const findTicketId = await Ticket.findOne({ where: { id } })
        if (!findTicketId) return res.json({ status: 404, msg: "ID not found" })

        const findSender = await User.findOne({ where: { id: user } })
        if (!findSender) return res.json({ status: 404, msg: "sender not found" })

        await Messages.create({
            message,
            sender: findSender.id,
            ticketid: id
        })
        return res.json({ status: 200, msg: 'message sent' })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.fetchAdmin = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) return res.json({ status: 404, msg: "ID is missing" })
        const findTicket = await Ticket.findOne({ where: { id } })
        if (!findTicket) return res.json({ status: 404, msg: "Ticket ID not found" })
        const findAdmin = await User.findOne({
            where: { id: findTicket.adminid },
            attributes: { exclude: TicketExcludes }
        })
        if (!findAdmin) return res.json({ status: 404, msg: "Admin not found" })
        return res.json({ status: 200, msg: 'admin fetch success', data: findAdmin })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.closeTicket = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) return res.json({ status: 404, msg: "ID is missing" })
        const findTicket = await Ticket.findOne({ where: { id } })
        if (!findTicket) return res.json({ status: 404, msg: "Ticket ID not found" })
        findTicket.status = 'closed'
        await findTicket.save()

        await Notify.create({
            type: 'Ticket Closed',
            message: `Hi, your ticket with the ID of ${findTicket.id} has been closed by the admin. always reach out to us via tickets if you encounter any issues.`,
            user: findTicket.userid
        })
        return res.json({ status: 200, msg: "ticket closed successfully" })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}