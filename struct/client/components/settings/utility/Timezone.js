const { Setting } = require('../../../interfaces/');

class Timezone extends Setting {

    constructor(client) {

        super(client, {
            name: 'timezone',
            module: 'utility',
            description: "Set a timezone to be formatted for the commands that you execute. Mainly used for moderation commands, but any dates will be formatted for your timezone.",
            aliases: [
                'tz'
            ],
            resolve: 'USER',
            default: {
                value: "America/New_York"
            }
        });

    }

    async parse(message, args) {
        if(args === this.default) return await super.reset(message.author.id);
        const lower = args.toLowerCase();

        let timezone = null;
        for(let region of regions) {
            if(lower === region.toLowerCase()) {
                timezone = region;
            }
        }

        if(!timezone) {
            return {
                error: true,
                message: `Unable to find a valid timezone region, use the command \`${message.guild.prefix}tag timezones\` to view all of the available regions.`
            };
        }

        await super.set(message.author.id, timezone);
        return { error: false, result: timezone };
    }

    fields(user) {
        const timezone = this.current(user);
        const emoji = emojis[timezone.split('/')[0]];
        return [
            {
                name: '》Timezone',
                value: `${emoji} \`${timezone}\``
            }
        ];
    }
    
    current(user) {
        return user._getSetting(this.index).value;
    }
    
}

module.exports = Timezone;

const regions = [
    "Africa/Abidjan",
    "Africa/Algiers",
    "Africa/Cairo",
    "Africa/Casablanca",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Africa/Maputo",
    "Africa/Nairobi",
    "Africa/Tripoli",
    "America/Adak",
    "America/Anchorage",
    "America/Campo_Grande",
    "America/Chicago",
    "America/Chihuahua",
    "America/Denver",
    "America/Fortaleza",
    "America/Halifax",
    "America/Havana",
    "America/La_Paz",
    "America/Lima",
    "America/Los_Angeles",
    "America/Managua",
    "America/Mexico_City",
    "America/New_York",
    "America/Noronha",
    "America/Panama",
    "America/Phoenix",
    "America/Santiago",
    "America/Santo_Domingo",
    "America/Sao_Paulo",
    "America/St_Johns",
    "Antarctica/Palmer",
    "Asia/Baghdad",
    "Asia/Bangkok",
    "Asia/Dhaka",
    "Asia/Dili",
    "Asia/Dubai",
    "Asia/Gaza",
    "Asia/Hong_Kong",
    "Asia/Jakarta",
    "Asia/Jerusalem",
    "Asia/Kamchatka",
    "Asia/Kathmandu",
    "Asia/Kolkata",
    "Asia/Kuala_Lumpur",
    "Asia/Makassar",
    "Asia/Rangoon",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Tashkent",
    "Asia/Tehran",
    "Asia/Tokyo",
    "Asia/Ulaanbaatar",
    "Asia/Vladivostok",
    "Asia/Yakutsk",
    "Atlantic/Azores",
    "Atlantic/Cape_Verde",
    "Australia/Adelaide",
    "Australia/Brisbane",
    "Australia/Darwin",
    "Australia/Lord_Howe",
    "Australia/Perth",
    "Australia/Sydney",
    "Europe/Athens",
    "Europe/Chisinau",
    "Europe/Dublin",
    "Europe/Istanbul",
    "Europe/Lisbon",
    "Europe/London",
    "Europe/Moscow",
    "Europe/Paris",
    "Europe/Ulyanovsk",
    "Pacific/Auckland",
    "Pacific/Chatham",
    "Pacific/Easter",
    "Pacific/Fakaofo",
    "Pacific/Galapagos",
    "Pacific/Gambier",
    "Pacific/Guadalcanal",
    "Pacific/Guam",
    "Pacific/Honolulu",
    "Pacific/Kiritimati",
    "Pacific/Niue",
    "Pacific/Pago_Pago",
    "Pacific/Pitcairn",
    "Pacific/Port_Moresby",
    "Pacific/Tahiti"
];

const emojis = {
    'Africa': '🇿🇦',
    'America': '🇺🇸',
    'Antartica': '🗻',
    'Asia': '🇨🇳',
    'Atlantic': '🌊',
    'Australia': '🇦🇺',
    'Europe': '🇪🇺',
    'Pacific': '🌊'
};