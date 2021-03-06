describe('dateDiff', function () {
    it('should return the difference in days of two dates', function () {
        var d1 = new Date('2010-01-01 10:00');
        var d2 = new Date('2010-01-02 10:00');

        expect(_.nw.dateDiff(d2, d1)).toBe(1);
    });
});

describe('roundToNearest', function () {
    it('should round the given number to the neares specified multiple', function () {
        expect(_.nw.roundToNearest(7, 14)).toBe(14);
        expect(_.nw.roundToNearest(7, 10)).toBe(10);
    });
});

describe('maxTickValues', function () {
    it('should return domain if domain length is less then maxTicks', function () {
        var domain = [1,2,3];
        expect(_.nw.maxTickValues(5, domain)).toEqual([1,2,3]);
    });

    it('should return domain if domain is empty', function () {
        var domain = [];
        expect(_.nw.maxTickValues(5, domain)).toEqual([]);
    });

    it('should return domain if domain length is equal to maxTicks', function () {
        var domain = [1,2,3];
        expect(_.nw.maxTickValues(3, domain)).toEqual([1,2,3]);
    });

    describe('when maxTicks is less than domain length', function () {
        var ticks;
        var domain = [1,2,3,4,5,6,7,8,9,10];
        var maxTicks = 4;

        beforeEach(function () {
            ticks = _.nw.maxTickValues(maxTicks, domain);
        });

        it('should return maxTicks as the length of the ticks array', function () {
            expect(ticks.length).toBe(maxTicks);
        });

        it('should return the first domain elements as tick', function () {
            expect(ticks[0]).toEqual(domain[0]);
        });

        it('should return evenly spaced ticks', function () {
            ticks = _.nw.maxTickValues(5, domain);
            expect(ticks).toEqual([1,3,5,7,9]);
        });

    });
});

describe('normalizeSeries', function () {

    beforeEach(function () {
        this.addMatchers({
            toBeNormalizedDataPoint: function () {
                var actual = this.actual;
                var notText = this.isNot ? ' not' : '';
                this.message = function () {
                    return 'Expected ' + actual + notText + ' to be normalized data point and is not';
                };

                return actual.hasOwnProperty('x') && actual.hasOwnProperty('y');
            },

            toBeNormalizedSeries: function () {
                var actual = this.actual;
                var notText = this.isNot ? ' not' : '';
                var missing = [];

                if(!actual.hasOwnProperty('name')) missing.push('series name (name)');
                if(!actual.hasOwnProperty('data')) missing.push('series data (data)');
                if(!_.all(actual.data, function (d) { return d.hasOwnProperty('x') && d.hasOwnProperty('y'); })) missing.push('not all data points have x & y fields');

                this.message = function () { return 'Expected object' + notText + ' to be normalize series and is missing: ' + missing.join(', '); };

                return !missing.length;
            },

            toBeSorted: function () {
                var actual = this.actual;
                var notText = this.isNot ? ' not' : '';
                var isSorted = true;
                this.message = function () {
                    return 'Expected series data ' + notText + ' to be sorted ';
                };

                _.each(actual, function (series) {
                    if (!series.data.length || !isSorted) return;
                    var prev = series.data[0].x;
                    for (var j=1, len=series.data.length; j<len; j++) {
                        if (prev > series.data[j].x) {
                            isSorted = false;
                            break;
                        }
                    }
                });

                return isSorted ;
            }
        });
    });

    it('should sort data if its not categorized ', function () {
        var data = [
            { x: 3, y: 5 },
            { x: 1, y: 5 },
            { x: 2, y: 5 }
        ];

        var series = _.nw.normalizeSeries(data);
        expect(series).toBeSorted();
    });

    it('should not sort data if its categorized', function () {
        var data = [ 5,6,7];
        var series = _.nw.normalizeSeries(data, ['d', 'x', 'a']);
        expect(series).not.toBeSorted();
    });

    it('should normalize a single array of values into an array with one series object', function () {
        var data = [1,2,3,4];
        var series = _.nw.normalizeSeries(data);

        expect(series.length).toBe(1);
        expect(series[0]).toBeNormalizedSeries();
    });

    it('should normalize a single array of x&y objects into an array with one normalized series', function () {
        var data = [
            { x: 'a', y:1 },
            { x: 'b', y:2 },
            { x: 'c', y:3 },
        ];
        var series = _.nw.normalizeSeries(data);

        expect(series.length).toBe(1);
        expect(series[0]).toBeNormalizedSeries();
    });

    it('should normalize an array of unnormalized series objects into an array of normalized series objects', function () {
        var data = [
            { name: 's1', data: [1,2,3,4] },
            { name: 's2', data: [1,2,3,4] },
            { name: 's3', data: [1,2,3,4] }
        ];
        var series = _.nw.normalizeSeries(data);

        expect(series.length).toBe(3);
        expect(series[0]).toBeNormalizedSeries();
        expect(series[1]).toBeNormalizedSeries();
        expect(series[2]).toBeNormalizedSeries();
    });

    it('should normalize an array of value arrays into an array of normalized series objects', function () {
        var data = [
            [1,2,3,4],
            [1,2,3,4],
            [1,2,3,4]
        ];
        var series = _.nw.normalizeSeries(data);

        expect(series.length).toBe(3);
        expect(series[0]).toBeNormalizedSeries();
        expect(series[1]).toBeNormalizedSeries();
        expect(series[2]).toBeNormalizedSeries();
    });

    it('should normalize missing Y points as null', function () {
        var data = [
            { x: 'a', y: 1 },
            { x: 'b', y: null },
            { x: 'c' },
        ];

        var series = _.nw.normalizeSeries(data);
        var s1 = series[0];

        expect(s1.data[0].y).toBe(1);
        expect(s1.data[1].y).toBe(null);
        expect(s1.data[2].y).toBe(null);
    });

    it('should normalize null array values as y=null', function () {
        var data = [1,2,null,undefined,3];
        var series = _.nw.normalizeSeries(data);
        var s1 = series[0];
        expect(s1.data[0].y).toBe(1);
        expect(s1.data[1].y).toBe(2);
        expect(s1.data[2].y).toBe(null);
        expect(s1.data[3].y).toBe(null);
        expect(s1.data[4].y).toBe(3);
    });

    it('should return same instance of data if is correctly formatted (no copy)', function () {
        var data = [
            {
                name: 'Series A',
                data: [
                    {x: 0, y: 1},
                    {x: 1, y: 2},
                    {x: 2, y: 3}
                ]
            }
        ];

        var series = _.nw.normalizeSeries(data);

        expect(series).toBe(data);
    });

    it('should insert the instance of data into a series object if data is in correct format', function () {
        var data = [
            {x: 0, y: 1},
            {x: 1, y: 2},
            {x: 2, y: 3}
        ];

        var series = _.nw.normalizeSeries(data);

        expect(series[0].data).toBe(data);
    });

    describe('when passing a categories array', function () {
        it('should use the categories array for normalized x values', function () {
            var data = [1,2,3,4];
            var cats = ['a', 'b', 'c', 'd'];

            var series = _.nw.normalizeSeries(data, cats);
            var s1 = series[0];

            expect(s1.data[0].x).toBe('a');
            expect(s1.data[1].x).toBe('b');
            expect(s1.data[2].x).toBe('c');
            expect(s1.data[3].x).toBe('d');

            expect(s1.data[0].y).toBe(1);
            expect(s1.data[1].y).toBe(2);
            expect(s1.data[2].y).toBe(3);
            expect(s1.data[3].y).toBe(4);
        });

        it('individual point X values should take presendence over the categories array (we may need to change this assumption later based on usage??)', function () {
            var data = [
                { x: 'x', y: 1 },
                { x: 'y', y: 2 },
                { x: 'z', y: 3 }
            ];
            var cats = ['a', 'b', 'c'];

            var series = _.nw.normalizeSeries(data, cats);
            var s1 = series[0];

            expect(s1.data[0].x).toBe('x');
            expect(s1.data[1].x).toBe('y');
            expect(s1.data[2].x).toBe('z');

            expect(s1.data[0].y).toBe(1);
            expect(s1.data[1].y).toBe(2);
            expect(s1.data[2].y).toBe(3);
        });
    });
});

describe('stacked layout', function () {
    it('should handle simple stacked data', function () {
        var data = [{name: 'a', data: [{x: 0, y: 1}, {x: 1, y: 2}]}, {name: 'b', data: [{x: 0, y: 4}, {x: 1, y: 5}]}];
        var expected = [
            { name: 'a', data: [{x: 0, y: 1, y0: 0}, {x: 1, y: 2, y0: 0}] },
            { name: 'b', data: [{x: 0, y: 4, y0: 1}, {x: 1, y: 5, y0: 2}] }
        ];

        var res = _.nw.stackLayout()(data);

        expect(res).toEqual(expected);
    });

    it('should handle stacked categorical data', function () {
        var data = [
            { name: 'app1', data: [{x:'10.10', y: 5}] },
            { name: 'app2', data: [{x:'10.10', y: 7}] },
            { name: 'app3', data: [{x:'10.11', y: 9}] },
            { name: 'app4', data: [{x:'10.11', y: 3}] }
        ];

        var expected = [
            { name: 'app1', data: [{x:'10.10', y: 5, y0: 0}] },
            { name: 'app2', data: [{x:'10.10', y: 7, y0: 5}] },
            { name: 'app3', data: [{x:'10.11', y: 9, y0: 0}] },
            { name: 'app4', data: [{x:'10.11', y: 3, y0: 9}] }
        ];

        var res = _.nw.stackLayout()(data);
        expect(res).toEqual(expected);
    });

    it('should handle complex categorical data', function () {
        var data = [
            { "data": [{ "x": "10.0.17.22", "y": 1, } ], "name": "/monitoring/model-lua" },
            { "data": [{ "x": "10.0.17.22", "y": 4, } ], "name": "/jaimedp/pda" },
            { "data": [{ "x": "10.0.17.22", "y": 1, } ], "name": "/monitoring/model-julia" },
            { "data": [{ "x": "10.0.17.22", "y": 146, } ], "name": "Free" }
        ];

        var expected = [
            { "data": [{ "x": "10.0.17.22", "y": 1, y0: 0 } ], "name": "/monitoring/model-lua" },
            { "data": [{ "x": "10.0.17.22", "y": 4, y0: 1 } ], "name": "/jaimedp/pda" },
            { "data": [{ "x": "10.0.17.22", "y": 1, y0: 5 } ], "name": "/monitoring/model-julia" },
            { "data": [{ "x": "10.0.17.22", "y": 146, y0: 6 } ], "name": "Free" }
        ];

        var res = _.nw.stackLayout()(data);
        expect(res).toEqual(expected);

    });
});
















