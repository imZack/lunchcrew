import * as Debug from 'debug';
import Restaurant from './Restaurant';
import * as randomItem from 'random-item';
import { writeFile, readFile } from 'fs';

const debug = Debug('lunchcrew:Restaurants');

class Restaurants {

  private list: Array<Restaurant>;
  private dbPath: string;
  constructor () {
    this.list = [];
    this.dbPath = process.env.dbPath || 'restaurants.json';
    debug('Init Restaurant: %j', this.list);
    this.Load().catch(err => debug(`can't find saved restaurants`, err));
  }

  /**
   * AddRestaurant
   */
  public AddRestaurant(newPlace: Restaurant): Restaurants {
    debug('Add Restaurant %j', newPlace);
    this.list.push(newPlace);
    this.Save().catch(err => debug(`can't save restaurants`, err));
    return this;
  }

  /**
   * RemoveRestaurant
   */
  public RemoveRestaurant(index: number): Restaurants {
    debug('Remove Restaurant ID: ', index);
    this.list.splice(index, 1);

    return this;
  }

  /**
   * PickRestaurant
   */
  public PickRestaurant(): Restaurant {
    debug('Pick Restaurant: ');

    return randomItem(this.list);
  }

  /**
   * List
   */
  public List = (): Array<Restaurant> => {
    return this.list;
  }

  /**
   * Save
   */
  public Save = (): Promise<any> => {
    debug('Save Restaurants');
    return new Promise((resolve, reject) => {
      writeFile(this.dbPath, JSON.stringify(this.list), function(err) {
        if (err) {
            return reject(err);
        }
        return resolve(null);
      });
    });
  }

  /**
   * Load
   */
  public Load = (): Promise<any> => {
    debug('Load Restaurants');
    return new Promise((resolve, reject) => {
      readFile(this.dbPath, (err, data) => {
        if (err) {
            return reject(err);
        }

        try {
          this.list = JSON.parse(data.toString());
        } catch (parseError) {
          return reject(parseError);
        }

        return resolve(null);
      });
    });
  }
}

export default Restaurants;
