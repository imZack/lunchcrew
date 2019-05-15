import * as express from 'express';
import * as line from '@line/bot-sdk';
import * as Debug from 'debug';
import * as emoji from 'node-emoji';
import Restaurants from './Restaurants';
const debug = Debug('lunchcrew:App');

interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
}

class App {
  public express: express.Express;
  private client: line.Client;
  private config: LineConfig;
  private restaurants: Restaurants;

  constructor () {
    this.config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.CHANNEL_SECRET
    };

    this.restaurants = new Restaurants();
    this.express = express();
    this.mountRoutes();
    this.client = new line.Client(this.config);
  }

  private mountRoutes = (): void => {
    const router = express.Router();
    router.post('/webhook', line.middleware(this.config), (req, res) => {
      Promise
        .all(req.body.events.map(event => this.handleEvent(event)))
        .then((result) => res.json(result));
    });

    this.express.use('/', router)
  }

  private handleEvent = (event): Promise<any> => {
    // Filter some messages here...
    debug(`got event %j`, event);
    if (event.type !== 'message') {
      debug(`not message, skip`);
      return Promise.resolve(null);
    }

    if (event.source.type !== 'group') {
      debug(`not group message, skip`);
      return Promise.resolve(null);
    }

    if (event.message.type !== 'text') {
      debug(`not text message, skip`);
      return Promise.resolve(null);
    }

    let replyMessage: string;
    // Split Command = [Action], [Options]
    const input = event.message.text;
    const split_pos = input.indexOf(' ');
    let action: string;
    let parameters: string;
    if (split_pos === -1) {
      action = input.trim();
    } else {
      action = input.substr(0, split_pos);
      parameters = input.substr(split_pos);
    }
    action = action.toLowerCase();

    debug('raw input', input);
    debug('action', action);
    debug('parameters', parameters);

    switch (action) {
      case 'help':
      case 'h':
        replyMessage = `Help Menu:

a,add <Name>
d,del,delete <IndexNumber>
l,list
eat,where,go,lunch`;
        break;

      case 'add':
      case 'a':
        const restaurant = {
          name: parameters.trim(),
          location: ''
        };
        this.restaurants.AddRestaurant(restaurant);
        replyMessage = `Name: ${restaurant.name}\nAdded.`;
        break;

      case 'delete':
      case 'del':
      case 'd':
        this.restaurants.RemoveRestaurant(+parameters);
        replyMessage = 'Deleted.';
        break;

      case 'list':
      case 'l':
      case 'listing':
        const list = this.restaurants.List();
        let index = 0;
        replyMessage = `Current Restaruants:\n${list
          .map(
            restaurant => `${index++}. ${restaurant.name}`)
          .join('\n')
        }`;
        debug(`listing: %j`, list);
        break;

      case 'eat':
      case 'where':
      case 'go':
      case 'lunch':
        const restaurantName = this.restaurants.PickRestaurant().name;
        const moji = emoji.random();
        replyMessage = `Let's go [ ${restaurantName} ] !!! ${moji.emoji}`;
        break;

      default:
        debug(`can't parsing the command: %a`, event.message.text);
        return Promise.resolve(null);
    }

    return this.client.replyMessage(event.replyToken, {
      type: 'text',
      text: `${replyMessage}`
    });
  }
}

export default new App().express;
